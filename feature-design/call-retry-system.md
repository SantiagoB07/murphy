# Call Retry System - Diseño de Implementación

## Resumen

Sistema de reintentos automáticos para llamadas de ElevenLabs cuando:
- La persona no contesta (`no_answer`)
- La línea está ocupada (`busy`)
- La llamada dura menos de 20 segundos (`too_short`)
- No se recibe webhook en 6 minutos (`failed`)

**Configuración:**
- Máximo 3 reintentos
- 5 minutos entre reintentos
- Umbral de llamada exitosa: ≥ 20 segundos
- Timeout de fallback: 6 minutos

---

## Arquitectura

```
     executeScheduledAlert() / llamada manual
                    │
                    ▼
            ┌───────────────┐
            │ initiateCall()│
            └───────┬───────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
  ElevenLabs API         Crear callRecord
  (outbound-call)        status: "initiated"
        │                retryCount: 0
        │                       │
        ▼                       ▼
  Recibe                 Programar
  conversationId         checkCallStatus()
        │                en 6 minutos
        │                       │
        └───────────┬───────────┘
                    │
                    ▼
            Esperar webhook...
                    │
    ┌───────────────┼───────────────┐
    │               │               │
    ▼               ▼               ▼
post_call      call_init       No llega
transcription  _failure        (6 min)
    │               │               │
    ▼               ▼               ▼
handleCall     handleCall      checkCall
Completed()    Failed()        Status()
    │               │               │
    ▼               ▼               ▼
┌─────────┐   ┌─────────┐    ┌─────────┐
│duración │   │status:  │    │status:  │
│≥ 20s?   │   │no_answer│    │failed   │
└────┬────┘   │o busy   │    └────┬────┘
     │        └────┬────┘         │
  ┌──┴──┐          │              │
  │     │          │              │
 Sí    No          │              │
  │     │          │              │
  ▼     ▼          ▼              ▼
completed  too_short ───────────────┐
  │                                 │
  │                                 ▼
  │                    ┌────────────────────┐
  │                    │  retryCount < 3?   │
  │                    └─────────┬──────────┘
  │                         ┌────┴────┐
  │                         │         │
  │                        Sí        No
  │                         │         │
  │                         ▼         ▼
  │                   scheduleRetry  FIN ❌
  │                   (5 min delay)
  │                         │
  │                         ▼
  │                   retryCall()
  │                   retryCount++
  │                         │
  │                         └──► initiateCall() (ciclo)
  │
  ▼
FIN ✅ (llamada exitosa)
```

---

## Archivos a Modificar/Crear

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `packages/backend/convex/schema.ts` | Modificar | Agregar tabla `callRecords` |
| `packages/backend/convex/callRecords.ts` | Crear | Mutations y queries para manejar llamadas |
| `packages/backend/convex/agent/webhooks.ts` | Crear | HTTP Action para webhooks de ElevenLabs |
| `packages/backend/convex/agent/actions.ts` | Modificar | Actualizar `initiateCall`, agregar `retryCall` |
| `packages/backend/convex/http.ts` | Modificar | Registrar nuevo endpoint |

---

## 1. Schema - Nueva tabla `callRecords`

**Archivo:** `packages/backend/convex/schema.ts`

```typescript
const callStatus = v.union(
  v.literal("initiated"),   // Llamada iniciada, esperando resultado
  v.literal("completed"),   // Llamada exitosa (≥ 20 segundos)
  v.literal("no_answer"),   // No contestaron
  v.literal("busy"),        // Línea ocupada
  v.literal("failed"),      // Error o timeout sin webhook
  v.literal("too_short")    // Llamada muy corta (< 20 segundos)
);

callRecords: defineTable({
  patientId: v.id("patientProfiles"),
  scheduleId: v.optional(v.id("aiCallSchedules")),
  conversationId: v.string(),
  status: callStatus,
  durationSeconds: v.optional(v.number()),
  retryCount: v.number(),
  alertType: v.optional(v.string()),
  createdAt: v.number(),
  completedAt: v.optional(v.number()),
  checkScheduledFunctionId: v.optional(v.id("_scheduled_functions")),
})
  .index("by_conversation", ["conversationId"])
  .index("by_patient", ["patientId"])
  .index("by_status", ["status"]),
```

---

## 2. CallRecords - Mutations y Queries

**Archivo:** `packages/backend/convex/callRecords.ts` (Crear)

### Constantes

```typescript
const RETRY_DELAY_MS = 5 * 60 * 1000;  // 5 minutos
const MAX_RETRIES = 3;
const MIN_CALL_DURATION = 20;           // segundos
const FALLBACK_CHECK_DELAY_MS = 6 * 60 * 1000; // 6 minutos
```

### Funciones

| Función | Tipo | Descripción |
|---------|------|-------------|
| `getByConversationId` | internalQuery | Busca registro por conversationId (para webhook) |
| `getById` | internalQuery | Busca registro por ID |
| `create` | internalMutation | Crea registro y programa checkCallStatus |
| `handleCallCompleted` | internalMutation | Procesa webhook `post_call_transcription` |
| `handleCallFailed` | internalMutation | Procesa webhook `call_initiation_failure` |
| `checkCallStatus` | internalMutation | Fallback: verifica si llegó webhook |

### Lógica de `handleCallCompleted`

```
1. Buscar callRecord por conversationId
2. Cancelar scheduled function de fallback
3. Si duración >= 20s → status: "completed"
4. Si duración < 20s → status: "too_short"
   - Si retryCount < 3 → programar retry en 5 min
```

### Lógica de `handleCallFailed`

```
1. Buscar callRecord por conversationId
2. Cancelar scheduled function de fallback
3. Mapear failure_reason a status (busy/no_answer)
4. Si retryCount < 3 → programar retry en 5 min
```

### Lógica de `checkCallStatus`

```
1. Obtener callRecord por ID
2. Si status != "initiated" → ya fue procesado, salir
3. Si status == "initiated" → no llegó webhook
   - Marcar como "failed"
   - Si retryCount < 3 → programar retry en 5 min
```

---

## 3. Webhooks - HTTP Action

**Archivo:** `packages/backend/convex/agent/webhooks.ts` (Crear)

```typescript
export const httpElevenLabsWebhook = httpAction(async (ctx, request) => {
  const body = await request.json();
  
  if (body.type === "post_call_transcription") {
    // Extraer conversation_id y call_duration_secs
    // Llamar handleCallCompleted
  }
  
  if (body.type === "call_initiation_failure") {
    // Extraer conversation_id y failure_reason
    // Llamar handleCallFailed
  }
  
  return new Response("OK", { status: 200 });
});
```

---

## 4. Actions - Modificaciones

**Archivo:** `packages/backend/convex/agent/actions.ts`

### 4.1 Modificar `initiateCall`

Nuevos argumentos:
- `scheduleId: v.optional(v.id("aiCallSchedules"))`
- `retryCount: v.optional(v.number())`

Después de recibir respuesta de ElevenLabs:
```typescript
// Crear registro de llamada
await ctx.runMutation(internal.callRecords.create, {
  patientId: args.patientId,
  scheduleId: args.scheduleId,
  conversationId,
  alertType: args.alertType,
  retryCount: args.retryCount ?? 0,
});
```

### 4.2 Agregar `retryCall`

```typescript
export const retryCall = internalAction({
  args: { callRecordId: v.id("callRecords") },
  handler: async (ctx, args) => {
    // 1. Obtener registro original
    // 2. Calcular newRetryCount = retryCount + 1
    // 3. Llamar initiateCall con mismos parámetros + newRetryCount
  },
});
```

### 4.3 Modificar `executeScheduledAlert`

Pasar `scheduleId` a `initiateCall`:
```typescript
await ctx.runAction(internal.agent.actions.initiateCall, {
  patientId: schedule.patientId,
  alertType: schedule.type,
  scheduleId: args.scheduleId,  // NUEVO
});
```

---

## 5. HTTP Router

**Archivo:** `packages/backend/convex/http.ts`

```typescript
import { httpElevenLabsWebhook } from "./agent/webhooks";

http.route({
  path: "/api/agent/webhook/elevenlabs",
  method: "POST",
  handler: httpElevenLabsWebhook,
});
```

---

## Configuración en ElevenLabs

1. Ir a [Agents Platform Settings](https://elevenlabs.io/app/agents/settings)
2. En "Post-call webhooks", configurar:
   - **URL**: `https://<deployment>.convex.site/api/agent/webhook/elevenlabs`
   - **Habilitar**: `post_call_transcription` y `call_initiation_failure`
   - **Deshabilitar**: `post_call_audio`

---

## Tabla de Estados

| Status | Descripción | ¿Retry? |
|--------|-------------|---------|
| `initiated` | Llamada en progreso | N/A |
| `completed` | Exitosa (≥ 20s) | No |
| `too_short` | Muy corta (< 20s) | Sí |
| `no_answer` | No contestaron | Sí |
| `busy` | Línea ocupada | Sí |
| `failed` | Error/sin webhook | Sí |

---

## Orden de Implementación

1. `schema.ts` - Agregar tabla `callRecords`
2. `callRecords.ts` - Crear mutations/queries
3. `agent/webhooks.ts` - Crear HTTP Action
4. `agent/actions.ts` - Modificar/agregar actions
5. `http.ts` - Registrar endpoint
6. ElevenLabs Dashboard - Configurar webhook URL
