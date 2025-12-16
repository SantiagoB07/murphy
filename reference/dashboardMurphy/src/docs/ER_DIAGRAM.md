# Diagrama ER - Murphy

## Versión: 2.0.0 | Actualizado: 2025-12-15

---

## Diagrama de Entidad-Relación

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              DIAGRAMA ENTIDAD-RELACIÓN                               │
└─────────────────────────────────────────────────────────────────────────────────────┘

                                    ┌──────────────────┐
                                    │    auth.users    │
                                    │   (Supabase)     │
                                    ├──────────────────┤
                                    │ id (PK, UUID)    │
                                    │ email            │
                                    │ raw_user_meta_   │
                                    │   data (JSONB)   │
                                    └────────┬─────────┘
                                             │
                 ┌───────────────────────────┼───────────────────────────┐
                 │                           │                           │
                 ▼ 1:1                       ▼ 1:N                       ▼ 1:1
    ┌──────────────────────┐    ┌──────────────────────┐    ┌──────────────────────┐
    │      PROFILES        │    │     USER_ROLES       │    │ NOTIFICATION_PREFS   │
    ├──────────────────────┤    ├──────────────────────┤    ├──────────────────────┤
    │ id (PK=auth.users.id)│    │ id (PK, UUID)        │    │ id (PK, UUID)        │
    │ full_name            │    │ user_id (FK)         │    │ user_id (FK, UNIQUE) │
    │ phone                │    │ role (ENUM)          │    │ glucose_alerts       │
    │ created_at           │    │ created_at           │    │ hypoglycemia_alerts  │
    │ updated_at           │    └──────────────────────┘    │ hyperglycemia_alerts │
    └──────────────────────┘                                │ medication_reminders │
                                                            │ measurement_reminders│
                                                            │ daily_summary        │
                                                            └──────────────────────┘

    ┌──────────────────────┐         1:1          ┌──────────────────────┐
    │  PATIENT_PROFILES    │◄─────────────────────│  COADMIN_PROFILES    │
    ├──────────────────────┤                      ├──────────────────────┤
    │ id (PK, UUID)        │                      │ id (PK, UUID)        │
    │ user_id (FK, UNIQUE) │                      │ user_id (FK, UNIQUE) │
    │ diabetes_type        │                      │ patient_id (FK,UNIQUE│
    │ diagnosis_year       │                      │ created_at           │
    │ birth_date           │                      │ updated_at           │
    │ gender (ENUM)        │                      └──────────────────────┘
    │ id_number            │
    │ city                 │
    │ estrato (1-6)        │
    │ xp_level             │
    │ streak               │
    │ coadmin_name         │
    │ coadmin_phone        │
    │ coadmin_email        │
    │ created_at           │
    │ updated_at           │
    └──────────┬───────────┘
               │
               │ 1:N (todas las tablas médicas)
               │
    ┌──────────┴──────────┬─────────────────┬─────────────────┬─────────────────┐
    │                     │                 │                 │                 │
    ▼                     ▼                 ▼                 ▼                 ▼
┌────────────┐    ┌────────────┐    ┌────────────┐    ┌────────────┐    ┌────────────┐
│  GLUCOSE   │    │  INSULIN   │    │   SLEEP    │    │   STRESS   │    │ DIZZINESS  │
│  RECORDS   │    │ SCHEDULES  │    │  RECORDS   │    │  RECORDS   │    │  RECORDS   │
├────────────┤    ├────────────┤    ├────────────┤    ├────────────┤    ├────────────┤
│ id (PK)    │    │ id (PK)    │    │ id (PK)    │    │ id (PK)    │    │ id (PK)    │
│ patient_id │    │ patient_id │    │ patient_id │    │ patient_id │    │ patient_id │
│ value      │    │ insulin_   │    │ hours      │    │ level(1-10)│    │ severity   │
│ time_slot  │    │   type     │    │ quality    │    │ notes      │    │   (1-5)    │
│ date       │    │ units_per_ │    │   (1-10)   │    │ recorded_at│    │ symptoms[] │
│ recorded_at│    │   dose     │    │ date       │    │ created_at │    │ duration_  │
│ notes      │    │ times_per_ │    │ created_at │    └────────────┘    │   minutes  │
│ created_at │    │   day      │    └────────────┘                      │ notes      │
│ updated_at │    │ brand      │                                        │ recorded_at│
└────────────┘    │ effective_ │                                        │ created_at │
                  │   from     │                                        └────────────┘
                  │ effective_ │
                  │   until    │
                  │ change_    │
                  │   reason   │
                  │ ordered_by │
                  │ is_active  │
                  │ notes      │
                  │ created_at │
                  │ updated_at │
                  └────────────┘

               │
               │ 1:N
               ▼
    ┌──────────────────────┐
    │  AI_CALL_SCHEDULES   │
    ├──────────────────────┤
    │ id (PK, UUID)        │
    │ patient_id (FK)      │
    │ scheduled_by_user_id │
    │ scheduled_by_role    │
    │ call_time (TIME)     │
    │ schedule_type        │
    │ days_of_week[]       │
    │ specific_dates[]     │
    │ call_purposes[]      │
    │ notification_channel │
    │ custom_message       │
    │ is_active            │
    │ created_at           │
    │ updated_at           │
    └──────────────────────┘
```

---

## Resumen de Tablas (11)

| # | Tabla | Descripción | Relación Principal |
|---|-------|-------------|-------------------|
| 1 | `profiles` | Datos básicos del usuario | 1:1 con auth.users |
| 2 | `user_roles` | Roles asignados | N:1 con auth.users |
| 3 | `patient_profiles` | Perfil médico del paciente | 1:1 con auth.users |
| 4 | `coadmin_profiles` | Vinculación coadmin-paciente | 1:1 con patient_profiles |
| 5 | `glucose_records` | Mediciones de glucosa | N:1 con patient_profiles |
| 6 | `insulin_schedules` | Historial de insulina | N:1 con patient_profiles |
| 7 | `sleep_records` | Registros de sueño | N:1 con patient_profiles |
| 8 | `stress_records` | Registros de estrés | N:1 con patient_profiles |
| 9 | `dizziness_records` | Registros de mareos | N:1 con patient_profiles |
| 10 | `notification_preferences` | Config. notificaciones | 1:1 con auth.users |
| 11 | `ai_call_schedules` | Alertas programadas | N:1 con patient_profiles |

---

## Enumeraciones (2)

```sql
-- Tipos de género
CREATE TYPE gender_type AS ENUM (
    'masculino', 
    'femenino', 
    'otro', 
    'prefiero_no_decir'
);

-- Roles de usuario
CREATE TYPE user_role AS ENUM (
    'patient',   -- Paciente: acceso completo a sus datos
    'coadmin',   -- Co-administrador: acceso limitado al paciente asignado
    'doctor'     -- Médico: acceso de lectura a pacientes asignados (futuro)
);
```

---

## Valores Permitidos (Constraints)

| Campo | Tabla | Valores |
|-------|-------|---------|
| `diabetes_type` | patient_profiles | 'Tipo 1', 'Tipo 2', 'Gestacional', 'LADA', 'MODY' |
| `estrato` | patient_profiles | 1-6 |
| `value` | glucose_records | 20-600 mg/dL |
| `time_slot` | glucose_records | 'before_breakfast', 'after_breakfast', 'before_lunch', 'after_lunch', 'before_dinner', 'after_dinner' |
| `insulin_type` | insulin_schedules | 'rapid', 'basal' |
| `units_per_dose` | insulin_schedules | 0.5-100 |
| `times_per_day` | insulin_schedules | 1-6 |
| `hours` | sleep_records | 0-24 |
| `quality` | sleep_records | 1-10 |
| `level` | stress_records | 1-10 |
| `severity` | dizziness_records | 1-5 |
| `symptoms` | dizziness_records | 'nausea', 'vision_blur', 'weakness', 'sweating', 'confusion', 'headache' |
| `days_of_week` | ai_call_schedules | 1-7 (1=Lun, 7=Dom) |
| `schedule_type` | ai_call_schedules | 'recurring', 'specific' |
| `notification_channel` | ai_call_schedules | 'call', 'whatsapp' |
| `call_purposes` | ai_call_schedules | 'glucose', 'wellness', 'insulin', 'reminder' |

---

## Relaciones Clave

### 1. Usuario → Perfiles
```
auth.users (1) ──────► (1) profiles
auth.users (1) ──────► (N) user_roles
auth.users (1) ──────► (1) patient_profiles (si es paciente)
auth.users (1) ──────► (1) coadmin_profiles (si es coadmin)
auth.users (1) ──────► (1) notification_preferences
```

### 2. Paciente → Datos Médicos
```
patient_profiles (1) ──────► (N) glucose_records
patient_profiles (1) ──────► (N) insulin_schedules
patient_profiles (1) ──────► (N) sleep_records
patient_profiles (1) ──────► (N) stress_records
patient_profiles (1) ──────► (N) dizziness_records
patient_profiles (1) ──────► (N) ai_call_schedules
```

### 3. Coadmin → Paciente
```
coadmin_profiles.patient_id ──────► patient_profiles.id (1:1 UNIQUE)
```

---

## Funciones de Base de Datos (4)

| Función | Tipo | Propósito |
|---------|------|-----------|
| `has_role(user_id, role)` | SECURITY DEFINER | Verificar si usuario tiene un rol específico |
| `is_authorized_coadmin_email(email)` | SECURITY DEFINER | Validar email autorizado para registro de coadmin |
| `handle_new_user()` | TRIGGER | Crear profiles + user_roles + coadmin_profiles al registrarse |
| `update_updated_at_column()` | TRIGGER | Actualizar `updated_at` automáticamente |

---

## Notas de Seguridad

1. **UUIDs:** Todos los IDs son UUID para evitar ataques de enumeración
2. **RLS habilitado:** Todas las tablas tienen Row Level Security activo
3. **Roles protegidos:** `user_roles` bloquea INSERT/UPDATE/DELETE directo (solo via trigger)
4. **Perfiles via trigger:** Los perfiles se crean automáticamente via `handle_new_user`
5. **Patrón patient_id:** Tablas médicas controladas por `patient_id` con acceso diferenciado por rol
6. **Sin DELETE en patient_profiles:** Protege la integridad del historial médico

---

## Referencias

- **Esquema SQL completo:** `src/docs/SQL_MIGRATION_DRAFT.sql`
- **Políticas RLS detalladas:** `src/docs/RLS_POLICIES.md`
- **Tipos TypeScript:** `src/integrations/supabase/types.ts`
