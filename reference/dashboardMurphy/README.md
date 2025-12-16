# Murphy

Dashboard inteligente para seguimiento de pacientes diabéticos con persistencia en Lovable Cloud, sistema de gamificación XP, y soporte para tres roles de usuario.

## 🚀 Quick Start

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:8080`

## ✅ Funcionalidades Implementadas

### Autenticación
- [x] Registro de pacientes (4 pasos con datos médicos completos)
- [x] Registro de co-administradores (email pre-autorizado)
- [x] Login con email/password
- [x] Modo demo para testing sin autenticación
- [x] RLS policies por rol

### Tracking de Glucosa
- [x] 6 slots diarios (antes/después de cada comida)
- [x] Vista diaria editable
- [x] Vista semanal (solo lectura)
- [x] Vista mensual con calendario
- [x] Vista trimestral con comparación
- [x] Estadísticas: promedio, min/max, % en rango, desviación estándar
- [x] Indicadores visuales por rango (normal, alto, bajo, crítico)

### Gestión de Insulina
- [x] Configuración de insulina rápida y basal
- [x] Historial completo de cambios de dosis
- [x] Cálculo automático de variación porcentual
- [x] Tracking de médico ordenante y razón de cambio
- [x] Marcas populares pre-configuradas

### Tracking de Bienestar
- [x] Registro de sueño (horas + calidad)
- [x] Registro de estrés (nivel 1-10)
- [x] Registro de mareos (severidad + síntomas)
- [x] Historial de últimos 30 días
- [x] Estadísticas de bienestar

### Sistema XP
- [x] Puntos por mediciones completadas
- [x] Bonus por mediciones en rango
- [x] Bonus por registro de bienestar
- [x] Multiplicador por racha (streak)
- [x] 5 niveles: Principiante → Maestro del Control

### Alertas Automáticas
- [x] Programación recurrente (días de semana)
- [x] Programación por fechas específicas
- [x] Canal: Llamada o WhatsApp
- [x] Múltiples propósitos (glucosa, bienestar, insulina, personalizado)

### Configuración
- [x] Datos personales editables
- [x] Cambio de contraseña
- [x] Preferencias de notificaciones
- [x] Gestión de dispositivos conectados

## 📁 Estructura del Proyecto

```
src/
├── components/
│   ├── alerts/           # Alertas automáticas (llamada/WhatsApp)
│   ├── auth/             # Formularios de autenticación
│   ├── daily-log/        # Dialog unificado de registro
│   ├── dashboard/        # Componentes del dashboard
│   ├── glucose/          # Tracking de glucosa (4 vistas)
│   ├── insulin/          # Gestión de insulina
│   ├── medico/           # Componentes del rol médico
│   ├── navigation/       # TopNavbar y MobileBottomNav
│   ├── settings/         # Sheets de configuración
│   ├── wellness/         # Historial de bienestar
│   └── ui/               # Componentes Shadcn/UI
├── contexts/
│   └── AuthContext.tsx   # Autenticación y sesión
├── hooks/
│   ├── useGlucoseLog.ts      # CRUD glucosa
│   ├── useInsulinSchedule.ts # CRUD insulina
│   ├── useWellnessLog.ts     # CRUD bienestar
│   ├── useXPCalculation.ts   # Sistema XP
│   └── useAICallSchedule.ts  # Alertas automáticas
├── pages/
│   ├── medico/           # Páginas del rol médico
│   ├── Index.tsx         # Landing page
│   ├── Auth.tsx          # Login/Registro
│   ├── Dashboard.tsx     # Dashboard principal
│   ├── Glucometrias.tsx  # Tracking de glucosa
│   ├── Insulina.tsx      # Gestión de insulina
│   ├── Alertas.tsx       # Alertas automáticas
│   └── Configuracion.tsx # Configuración
├── types/
│   ├── diabetes.ts       # Tipos del dominio
│   └── auth.ts           # Tipos de autenticación
└── lib/
    ├── constants.ts      # Design tokens
    ├── navigation.ts     # Navegación condicional
    ├── xpSystem.ts       # Lógica XP
    └── utils.ts          # Utilidades
```

## 🗄️ Base de Datos

### Tablas Principales

| Tabla | Descripción |
|-------|-------------|
| `profiles` | Datos básicos de usuario |
| `user_roles` | Roles (patient, coadmin, doctor) |
| `patient_profiles` | Perfil médico del paciente |
| `coadmin_profiles` | Vinculación coadmin-paciente |
| `glucose_records` | Mediciones de glucosa |
| `insulin_schedules` | Historial de insulina |
| `sleep_records` | Registros de sueño |
| `stress_records` | Registros de estrés |
| `dizziness_records` | Registros de mareos |
| `notification_preferences` | Preferencias de notificaciones |
| `ai_call_schedules` | Alertas automáticas |

### Funciones

- `has_role(user_id, role)` - Verificar rol de usuario (SECURITY DEFINER)
- `is_authorized_coadmin_email(email)` - Validar email de coadmin para registro
- `handle_new_user()` - Trigger post-registro que crea profiles, user_roles y patient/coadmin_profiles
- `update_updated_at_column()` - Trigger para actualizar timestamps automáticamente

### Seguridad RLS

- **26 políticas RLS** implementadas en todas las tablas
- **Roles protegidos:** `user_roles` bloquea INSERT/UPDATE/DELETE directo (solo via trigger)
- **Profiles via trigger:** No se pueden crear perfiles manualmente, solo via `handle_new_user`
- **Patrón patient_id:** Tablas médicas controladas por `patient_id` con acceso diferenciado por rol

## 👥 Roles de Usuario

| Rol | Permisos | Vista Principal |
|-----|----------|-----------------|
| **Paciente** | CRUD sobre sus datos, configura coadmin | Dashboard personal |
| **Co-administrador** | Lectura + escritura de insulina del paciente asignado | Vista espejo del paciente |
| **Médico** | Lectura de pacientes asignados, crear alertas/reportes | CRM con lista de pacientes |

## 🎨 Sistema de Diseño

### Principios (Apple HIG)
- Claridad, Deferencia, Profundidad
- Touch targets mínimo 44px
- Feedback inmediato (toasts)
- Contraste WCAG AA

### Paleta de Colores (Tema Oscuro)
```css
--purple-500: #B46BFF;  /* Acento principal */
--purple-400: #D08BFF;  /* Hover */
--purple-600: #8A32FF;  /* Active */
--bg-dark-900: #0D021F; /* Fondo principal */
--bg-dark-800: #1A0332; /* Fondo secundario */
```

### Clases Utilitarias
- `.glass-card` - Tarjetas con efecto glassmorphism
- `.glow-border` - Borde con efecto glow en hover
- `.glow-text` - Texto con sombra neón
- `.btn-neon` - Botón con estilo neón

## 📱 Responsivo

- **Mobile** (< 768px): Bottom navigation bar (5 items)
- **Desktop** (≥ 768px): Top navigation bar

## 🛠️ Tecnologías

- **Framework**: React 18 + TypeScript + Vite
- **Estilos**: Tailwind CSS + Shadcn/UI
- **Backend**: Lovable Cloud (Supabase)
- **Estado**: TanStack React Query
- **Validación**: Zod + React Hook Form
- **Gráficos**: Recharts
- **Routing**: React Router DOM v6

## 📋 Roadmap

- [ ] Integración ElevenLabs para llamadas de voz IA
- [ ] Integración WhatsApp Business API
- [ ] CRM completo para médicos
- [ ] Sincronización con glucómetros Bluetooth
- [ ] PWA con notificaciones push
- [ ] Exportación de datos (PDF, CSV)

## 📖 Documentación Adicional

- `llms.txt` - Contexto completo para LLMs
- `src/docs/ER_DIAGRAM.md` - Diagrama Entidad-Relación
- `src/docs/RLS_POLICIES.md` - Políticas de seguridad RLS

---

**Versión**: 2.0.0  
**Licencia**: Privada  
**Año**: 2025
