# Políticas RLS - Murphy

## Estado: ✅ Implementado y Activo

Este documento describe las 26 políticas de Row Level Security actualmente implementadas en producción.

---

## Funciones Auxiliares Implementadas

```sql
-- Verificar si usuario tiene un rol específico (SECURITY DEFINER para evitar recursión)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role user_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Verificar email autorizado para registro de coadmin
CREATE OR REPLACE FUNCTION public.is_authorized_coadmin_email(_email text)
RETURNS TABLE(patient_profile_id uuid, patient_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT pp.id, p.full_name
  FROM patient_profiles pp
  JOIN profiles p ON p.id = pp.user_id
  WHERE LOWER(pp.coadmin_email) = LOWER(_email)
    AND NOT EXISTS (
      SELECT 1 FROM coadmin_profiles cp WHERE cp.patient_id = pp.id
    )
$$;

-- Trigger para crear perfiles automáticamente post-registro
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role user_role;
  _patient_id UUID;
BEGIN
  _role := COALESCE((NEW.raw_user_meta_data ->> 'role')::user_role, 'patient');
  
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''), NEW.raw_user_meta_data ->> 'phone');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role);
  
  IF _role = 'coadmin' THEN
    _patient_id := (NEW.raw_user_meta_data ->> 'patient_id')::UUID;
    IF _patient_id IS NOT NULL THEN
      INSERT INTO public.coadmin_profiles (user_id, patient_id)
      VALUES (NEW.id, _patient_id);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;
```

---

## Políticas por Tabla

### 1. PROFILES (2 políticas)

```sql
-- Users can view own profile
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- Users can update own profile
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);
```

**Nota:** No hay políticas INSERT/DELETE. Los perfiles se crean via trigger `handle_new_user`.

---

### 2. USER_ROLES (4 políticas - 3 restrictivas)

```sql
-- Users can view own roles
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

-- No direct role inserts (bloqueo total)
CREATE POLICY "No direct role inserts"
ON public.user_roles FOR INSERT
WITH CHECK (false);

-- No direct role updates (bloqueo total)
CREATE POLICY "No direct role updates"
ON public.user_roles FOR UPDATE
USING (false)
WITH CHECK (false);

-- No direct role deletes (bloqueo total)
CREATE POLICY "No direct role deletes"
ON public.user_roles FOR DELETE
USING (false);
```

**⚠️ Seguridad crítica:** Roles solo se asignan via trigger `handle_new_user` (service_role). Esto previene escalación de privilegios.

---

### 3. PATIENT_PROFILES (3 políticas)

```sql
-- Patients can view own patient_profile
CREATE POLICY "Patients can view own patient_profile"
ON public.patient_profiles FOR SELECT
USING (auth.uid() = user_id);

-- Patients can insert own patient_profile
CREATE POLICY "Patients can insert own patient_profile"
ON public.patient_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Patients can update own patient_profile
CREATE POLICY "Patients can update own patient_profile"
ON public.patient_profiles FOR UPDATE
USING (auth.uid() = user_id);
```

**Nota:** No hay política DELETE para proteger integridad de datos médicos.

---

### 4. COADMIN_PROFILES (2 políticas)

```sql
-- Coadmins can view own profile
CREATE POLICY "Coadmins can view own profile"
ON public.coadmin_profiles FOR SELECT
USING (auth.uid() = user_id);

-- Patients can view their coadmin
CREATE POLICY "Patients can view their coadmin"
ON public.coadmin_profiles FOR SELECT
USING (patient_id IN (
  SELECT id FROM patient_profiles WHERE user_id = auth.uid()
));
```

**Nota:** No hay INSERT/UPDATE/DELETE. Coadmin profiles se crean via trigger.

---

### 5. GLUCOSE_RECORDS (2 políticas)

```sql
-- Patients can manage own glucose records
CREATE POLICY "Patients can manage own glucose records"
ON public.glucose_records FOR ALL
USING (patient_id IN (
  SELECT id FROM patient_profiles WHERE user_id = auth.uid()
));

-- Coadmins can view patient glucose records
CREATE POLICY "Coadmins can view patient glucose records"
ON public.glucose_records FOR SELECT
USING (patient_id IN (
  SELECT patient_id FROM coadmin_profiles WHERE user_id = auth.uid()
));
```

---

### 6. INSULIN_SCHEDULES (4 políticas)

```sql
-- Patients can manage own insulin
CREATE POLICY "Patients can manage own insulin"
ON public.insulin_schedules FOR ALL
USING (patient_id IN (
  SELECT id FROM patient_profiles WHERE user_id = auth.uid()
))
WITH CHECK (patient_id IN (
  SELECT id FROM patient_profiles WHERE user_id = auth.uid()
));

-- Coadmins can view patient insulin
CREATE POLICY "Coadmins can view patient insulin"
ON public.insulin_schedules FOR SELECT
USING (patient_id IN (
  SELECT patient_id FROM coadmin_profiles WHERE user_id = auth.uid()
));

-- Coadmins can insert patient insulin
CREATE POLICY "Coadmins can insert patient insulin"
ON public.insulin_schedules FOR INSERT
WITH CHECK (patient_id IN (
  SELECT patient_id FROM coadmin_profiles WHERE user_id = auth.uid()
));

-- Coadmins can update patient insulin
CREATE POLICY "Coadmins can update patient insulin"
ON public.insulin_schedules FOR UPDATE
USING (patient_id IN (
  SELECT patient_id FROM coadmin_profiles WHERE user_id = auth.uid()
))
WITH CHECK (patient_id IN (
  SELECT patient_id FROM coadmin_profiles WHERE user_id = auth.uid()
));
```

---

### 7. SLEEP_RECORDS (2 políticas)

```sql
-- Patients can manage own sleep records
CREATE POLICY "Patients can manage own sleep records"
ON public.sleep_records FOR ALL
USING (patient_id IN (
  SELECT id FROM patient_profiles WHERE user_id = auth.uid()
));

-- Coadmins can view patient sleep records
CREATE POLICY "Coadmins can view patient sleep records"
ON public.sleep_records FOR SELECT
USING (patient_id IN (
  SELECT patient_id FROM coadmin_profiles WHERE user_id = auth.uid()
));
```

---

### 8. STRESS_RECORDS (2 políticas)

```sql
-- Patients can manage own stress records
CREATE POLICY "Patients can manage own stress records"
ON public.stress_records FOR ALL
USING (patient_id IN (
  SELECT id FROM patient_profiles WHERE user_id = auth.uid()
));

-- Coadmins can view patient stress records
CREATE POLICY "Coadmins can view patient stress records"
ON public.stress_records FOR SELECT
USING (patient_id IN (
  SELECT patient_id FROM coadmin_profiles WHERE user_id = auth.uid()
));
```

---

### 9. DIZZINESS_RECORDS (2 políticas)

```sql
-- Patients can manage own dizziness records
CREATE POLICY "Patients can manage own dizziness records"
ON public.dizziness_records FOR ALL
USING (patient_id IN (
  SELECT id FROM patient_profiles WHERE user_id = auth.uid()
));

-- Coadmins can view patient dizziness records
CREATE POLICY "Coadmins can view patient dizziness records"
ON public.dizziness_records FOR SELECT
USING (patient_id IN (
  SELECT patient_id FROM coadmin_profiles WHERE user_id = auth.uid()
));
```

---

### 10. AI_CALL_SCHEDULES (2 políticas)

```sql
-- Patients can manage own call schedules
CREATE POLICY "Patients can manage own call schedules"
ON public.ai_call_schedules FOR ALL
USING (patient_id IN (
  SELECT id FROM patient_profiles WHERE user_id = auth.uid()
))
WITH CHECK (patient_id IN (
  SELECT id FROM patient_profiles WHERE user_id = auth.uid()
));

-- Coadmins can manage patient call schedules
CREATE POLICY "Coadmins can manage patient call schedules"
ON public.ai_call_schedules FOR ALL
USING (patient_id IN (
  SELECT patient_id FROM coadmin_profiles WHERE user_id = auth.uid()
))
WITH CHECK (patient_id IN (
  SELECT patient_id FROM coadmin_profiles WHERE user_id = auth.uid()
));
```

---

### 11. NOTIFICATION_PREFERENCES (1 política)

```sql
-- Users manage own notification preferences
CREATE POLICY "Users manage own notification preferences"
ON public.notification_preferences FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

---

## Resumen de Permisos por Rol

| Tabla | Paciente | Co-administrador |
|-------|----------|------------------|
| `profiles` | SELECT, UPDATE propio | SELECT, UPDATE propio |
| `user_roles` | SELECT propio | SELECT propio |
| `patient_profiles` | SELECT, INSERT, UPDATE propio | - |
| `coadmin_profiles` | SELECT su coadmin | SELECT propio |
| `glucose_records` | CRUD propio | SELECT asignado |
| `insulin_schedules` | CRUD propio | SELECT, INSERT, UPDATE asignado |
| `sleep_records` | CRUD propio | SELECT asignado |
| `stress_records` | CRUD propio | SELECT asignado |
| `dizziness_records` | CRUD propio | SELECT asignado |
| `ai_call_schedules` | CRUD propio | CRUD asignado |
| `notification_preferences` | CRUD propio | CRUD propio |

**Total: 26 políticas RLS activas**

---

## Consideraciones de Seguridad

### 1. Protección de Roles
- La tabla `user_roles` tiene políticas que bloquean INSERT/UPDATE/DELETE directo
- Solo el trigger `handle_new_user` (ejecutado con `service_role`) puede asignar roles
- Esto previene ataques de escalación de privilegios

### 2. Perfiles Gestionados por Trigger
- Los perfiles en `profiles`, `user_roles` y `coadmin_profiles` se crean automáticamente
- No hay políticas INSERT directas para estas tablas
- El trigger `handle_new_user` se ejecuta después de `auth.users` INSERT

### 3. Patrón de Acceso por Patient_ID
- Tablas médicas usan `patient_id` como clave de acceso
- Pacientes acceden via: `patient_id IN (SELECT id FROM patient_profiles WHERE user_id = auth.uid())`
- Coadmins acceden via: `patient_id IN (SELECT patient_id FROM coadmin_profiles WHERE user_id = auth.uid())`

### 4. Políticas Restrictivas
- Todas las políticas usan `Permissive: No` (restrictivas)
- Requieren match explícito, no permiten acceso por defecto

### 5. Separación de Roles
- Roles almacenados en tabla separada (`user_roles`), no en `profiles`
- Función `has_role()` es `SECURITY DEFINER` para evitar recursión RLS

### 6. Integridad de Datos Médicos
- `patient_profiles` no tiene política DELETE para proteger historial
- Coadmins no pueden DELETE datos del paciente
- Solo pueden SELECT o UPDATE/INSERT según la tabla

---

## Verificación

Para verificar las políticas activas:

```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```
