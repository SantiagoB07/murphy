-- ============================================
-- Murphy - SQL Schema Completo
-- Listo para ejecutar en Supabase
-- Versión: 2.0.0
-- Fecha: 2025-12-15
-- ============================================

-- ============================================
-- ENUMERACIONES
-- ============================================

CREATE TYPE public.gender_type AS ENUM ('masculino', 'femenino', 'otro', 'prefiero_no_decir');
CREATE TYPE public.user_role AS ENUM ('patient', 'coadmin', 'doctor');

-- ============================================
-- TABLAS PRINCIPALES
-- ============================================

-- Perfiles básicos de usuario (vinculado a auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL DEFAULT '',
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Roles de usuario (separado por seguridad - previene escalación de privilegios)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.user_role NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, role)
);

-- Perfiles de pacientes (datos médicos extendidos)
CREATE TABLE public.patient_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    -- Información médica
    diabetes_type TEXT NOT NULL CHECK (diabetes_type IN ('Tipo 1', 'Tipo 2', 'Gestacional', 'LADA', 'MODY')),
    diagnosis_year INTEGER,
    -- Datos personales
    birth_date DATE,
    gender public.gender_type,
    id_number TEXT,
    city TEXT,
    estrato INTEGER CHECK (estrato >= 1 AND estrato <= 6),
    -- Sistema de gamificación
    xp_level INTEGER DEFAULT 0,
    streak INTEGER DEFAULT 0,
    -- Co-administrador embebido (datos de contacto)
    coadmin_name TEXT,
    coadmin_phone TEXT,
    coadmin_email TEXT, -- Email autorizado para registro de coadmin
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Perfiles de co-administradores (vinculación con paciente)
CREATE TABLE public.coadmin_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    patient_id UUID NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLAS DE DATOS MÉDICOS
-- ============================================

-- Registros de glucosa (6 slots diarios)
CREATE TABLE public.glucose_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
    value INTEGER NOT NULL CHECK (value >= 20 AND value <= 600),
    time_slot TEXT NOT NULL CHECK (time_slot IN ('before_breakfast', 'after_breakfast', 'before_lunch', 'after_lunch', 'before_dinner', 'after_dinner')),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Esquemas de insulina (historial de cambios de dosis)
CREATE TABLE public.insulin_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
    insulin_type TEXT NOT NULL CHECK (insulin_type IN ('rapid', 'basal')),
    units_per_dose NUMERIC NOT NULL CHECK (units_per_dose >= 0.5 AND units_per_dose <= 100),
    times_per_day INTEGER NOT NULL CHECK (times_per_day >= 1 AND times_per_day <= 6),
    brand TEXT, -- Marca de insulina (Humalog, Lantus, etc.)
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_until DATE, -- NULL si está activo
    change_reason TEXT,
    ordered_by TEXT, -- Médico ordenante
    changed_by_user_id UUID REFERENCES auth.users(id),
    changed_by_role TEXT CHECK (changed_by_role IN ('patient', 'coadmin')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Registros de sueño (1 por día)
CREATE TABLE public.sleep_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
    hours NUMERIC NOT NULL CHECK (hours >= 0 AND hours <= 24),
    quality INTEGER NOT NULL CHECK (quality >= 1 AND quality <= 10),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(patient_id, date)
);

-- Registros de estrés
CREATE TABLE public.stress_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
    level INTEGER NOT NULL CHECK (level >= 1 AND level <= 10),
    notes TEXT,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Registros de mareos
CREATE TABLE public.dizziness_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
    severity INTEGER NOT NULL CHECK (severity >= 1 AND severity <= 5),
    symptoms TEXT[], -- ARRAY: 'nausea', 'vision_blur', 'weakness', 'sweating', 'confusion', 'headache'
    duration_minutes INTEGER,
    notes TEXT,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CONFIGURACIÓN Y ALERTAS
-- ============================================

-- Preferencias de notificaciones
CREATE TABLE public.notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    glucose_alerts BOOLEAN DEFAULT TRUE,
    hypoglycemia_alerts BOOLEAN DEFAULT TRUE,
    hyperglycemia_alerts BOOLEAN DEFAULT TRUE,
    medication_reminders BOOLEAN DEFAULT FALSE,
    measurement_reminders BOOLEAN DEFAULT TRUE,
    daily_summary BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Programación de alertas automáticas (llamadas/WhatsApp)
CREATE TABLE public.ai_call_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patient_profiles(id) ON DELETE CASCADE,
    scheduled_by_user_id UUID NOT NULL REFERENCES auth.users(id),
    scheduled_by_role TEXT NOT NULL CHECK (scheduled_by_role IN ('patient', 'coadmin')),
    call_time TIME NOT NULL,
    schedule_type TEXT NOT NULL DEFAULT 'recurring' CHECK (schedule_type IN ('recurring', 'specific')),
    days_of_week INTEGER[], -- 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie, 6=Sáb, 7=Dom
    specific_dates DATE[], -- Para schedule_type='specific'
    call_purposes TEXT[] NOT NULL, -- ARRAY: 'glucose', 'wellness', 'insulin', 'reminder'
    notification_channel TEXT NOT NULL DEFAULT 'call' CHECK (notification_channel IN ('call', 'whatsapp')),
    custom_message TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ÍNDICES
-- ============================================

-- Índices para consultas frecuentes
CREATE INDEX idx_glucose_records_patient_date ON public.glucose_records(patient_id, date DESC);
CREATE INDEX idx_sleep_records_patient_date ON public.sleep_records(patient_id, date DESC);
CREATE INDEX idx_stress_records_patient ON public.stress_records(patient_id, recorded_at DESC);
CREATE INDEX idx_dizziness_records_patient ON public.dizziness_records(patient_id, recorded_at DESC);

-- Índices para alertas activas
CREATE INDEX idx_insulin_schedules_patient_active ON public.insulin_schedules(patient_id) WHERE is_active = TRUE;
CREATE INDEX idx_ai_call_schedules_patient ON public.ai_call_schedules(patient_id) WHERE is_active = TRUE;

-- Índice único parcial: solo un esquema de insulina activo por tipo por paciente
CREATE UNIQUE INDEX idx_insulin_one_active_per_type 
    ON public.insulin_schedules(patient_id, insulin_type) 
    WHERE is_active = TRUE;

-- ============================================
-- FUNCIONES
-- ============================================

-- Función para verificar roles (SECURITY DEFINER evita recursión RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.user_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id AND role = _role
    )
$$;

-- Función para verificar email de coadmin autorizado
CREATE OR REPLACE FUNCTION public.is_authorized_coadmin_email(_email TEXT)
RETURNS TABLE(patient_profile_id UUID, patient_name TEXT)
LANGUAGE SQL
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

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Trigger que crea perfiles automáticamente al registrarse un usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _role public.user_role;
    _patient_id UUID;
    _patient_profile_id UUID;
BEGIN
    -- Determinar rol desde metadata (default: patient)
    _role := COALESCE(
        (NEW.raw_user_meta_data ->> 'role')::public.user_role, 
        'patient'
    );
    
    -- Insertar perfil básico
    INSERT INTO public.profiles (id, full_name, phone)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
        NEW.raw_user_meta_data ->> 'phone'
    );
    
    -- Insertar rol de usuario
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, _role);
    
    -- Si es paciente, crear patient_profile con todos los datos médicos
    IF _role = 'patient' THEN
        INSERT INTO public.patient_profiles (
            user_id,
            gender,
            id_number,
            birth_date,
            diabetes_type,
            diagnosis_year,
            city,
            estrato,
            coadmin_name,
            coadmin_phone,
            coadmin_email
        ) VALUES (
            NEW.id,
            (NEW.raw_user_meta_data ->> 'gender')::public.gender_type,
            NEW.raw_user_meta_data ->> 'id_number',
            (NEW.raw_user_meta_data ->> 'birth_date')::DATE,
            NEW.raw_user_meta_data ->> 'diabetes_type',
            (NEW.raw_user_meta_data ->> 'diagnosis_year')::INTEGER,
            NEW.raw_user_meta_data ->> 'city',
            (NEW.raw_user_meta_data ->> 'estrato')::INTEGER,
            NEW.raw_user_meta_data ->> 'coadmin_name',
            NEW.raw_user_meta_data ->> 'coadmin_phone',
            NEW.raw_user_meta_data ->> 'coadmin_email'
        );
    END IF;
    
    -- Si es coadmin, crear coadmin_profile con enlace a paciente
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

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger para crear perfiles en signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Triggers para updated_at automático
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patient_profiles_updated_at
    BEFORE UPDATE ON public.patient_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_coadmin_profiles_updated_at
    BEFORE UPDATE ON public.coadmin_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_glucose_records_updated_at
    BEFORE UPDATE ON public.glucose_records
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_insulin_schedules_updated_at
    BEFORE UPDATE ON public.insulin_schedules
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at
    BEFORE UPDATE ON public.notification_preferences
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_call_schedules_updated_at
    BEFORE UPDATE ON public.ai_call_schedules
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- HABILITAR ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coadmin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.glucose_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insulin_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sleep_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stress_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dizziness_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_call_schedules ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS RLS (26 políticas)
-- ============================================

-- ----------------------------------------
-- profiles: solo ver/editar perfil propio
-- ----------------------------------------
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- ----------------------------------------
-- user_roles: solo lectura propia, modificación bloqueada
-- (Solo el trigger handle_new_user puede crear roles)
-- ----------------------------------------
CREATE POLICY "Users can view own roles" ON public.user_roles
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "No direct role inserts" ON public.user_roles
    FOR INSERT WITH CHECK (false);
CREATE POLICY "No direct role updates" ON public.user_roles
    FOR UPDATE USING (false) WITH CHECK (false);
CREATE POLICY "No direct role deletes" ON public.user_roles
    FOR DELETE USING (false);

-- ----------------------------------------
-- patient_profiles: CRUD propio (sin DELETE para proteger historial)
-- ----------------------------------------
CREATE POLICY "Patients can view own patient_profile" ON public.patient_profiles
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Patients can insert own patient_profile" ON public.patient_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Patients can update own patient_profile" ON public.patient_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- ----------------------------------------
-- coadmin_profiles: lectura propia + paciente puede ver su coadmin
-- ----------------------------------------
CREATE POLICY "Coadmins can view own profile" ON public.coadmin_profiles
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Patients can view their coadmin" ON public.coadmin_profiles
    FOR SELECT USING (patient_id IN (
        SELECT id FROM patient_profiles WHERE user_id = auth.uid()
    ));

-- ----------------------------------------
-- glucose_records: Patient CRUD, Coadmin SELECT
-- ----------------------------------------
CREATE POLICY "Patients can manage own glucose records" ON public.glucose_records
    FOR ALL USING (patient_id IN (
        SELECT id FROM patient_profiles WHERE user_id = auth.uid()
    )) WITH CHECK (patient_id IN (
        SELECT id FROM patient_profiles WHERE user_id = auth.uid()
    ));
CREATE POLICY "Coadmins can view patient glucose records" ON public.glucose_records
    FOR SELECT USING (patient_id IN (
        SELECT patient_id FROM coadmin_profiles WHERE user_id = auth.uid()
    ));

-- ----------------------------------------
-- insulin_schedules: Patient CRUD, Coadmin SELECT/INSERT/UPDATE
-- ----------------------------------------
CREATE POLICY "Patients can manage own insulin" ON public.insulin_schedules
    FOR ALL USING (patient_id IN (
        SELECT id FROM patient_profiles WHERE user_id = auth.uid()
    )) WITH CHECK (patient_id IN (
        SELECT id FROM patient_profiles WHERE user_id = auth.uid()
    ));
CREATE POLICY "Coadmins can view patient insulin" ON public.insulin_schedules
    FOR SELECT USING (patient_id IN (
        SELECT patient_id FROM coadmin_profiles WHERE user_id = auth.uid()
    ));
CREATE POLICY "Coadmins can insert patient insulin" ON public.insulin_schedules
    FOR INSERT WITH CHECK (patient_id IN (
        SELECT patient_id FROM coadmin_profiles WHERE user_id = auth.uid()
    ));
CREATE POLICY "Coadmins can update patient insulin" ON public.insulin_schedules
    FOR UPDATE USING (patient_id IN (
        SELECT patient_id FROM coadmin_profiles WHERE user_id = auth.uid()
    )) WITH CHECK (patient_id IN (
        SELECT patient_id FROM coadmin_profiles WHERE user_id = auth.uid()
    ));

-- ----------------------------------------
-- sleep_records: Patient CRUD, Coadmin SELECT
-- ----------------------------------------
CREATE POLICY "Patients can manage own sleep records" ON public.sleep_records
    FOR ALL USING (patient_id IN (
        SELECT id FROM patient_profiles WHERE user_id = auth.uid()
    )) WITH CHECK (patient_id IN (
        SELECT id FROM patient_profiles WHERE user_id = auth.uid()
    ));
CREATE POLICY "Coadmins can view patient sleep records" ON public.sleep_records
    FOR SELECT USING (patient_id IN (
        SELECT patient_id FROM coadmin_profiles WHERE user_id = auth.uid()
    ));

-- ----------------------------------------
-- stress_records: Patient CRUD, Coadmin SELECT
-- ----------------------------------------
CREATE POLICY "Patients can manage own stress records" ON public.stress_records
    FOR ALL USING (patient_id IN (
        SELECT id FROM patient_profiles WHERE user_id = auth.uid()
    )) WITH CHECK (patient_id IN (
        SELECT id FROM patient_profiles WHERE user_id = auth.uid()
    ));
CREATE POLICY "Coadmins can view patient stress records" ON public.stress_records
    FOR SELECT USING (patient_id IN (
        SELECT patient_id FROM coadmin_profiles WHERE user_id = auth.uid()
    ));

-- ----------------------------------------
-- dizziness_records: Patient CRUD, Coadmin SELECT
-- ----------------------------------------
CREATE POLICY "Patients can manage own dizziness records" ON public.dizziness_records
    FOR ALL USING (patient_id IN (
        SELECT id FROM patient_profiles WHERE user_id = auth.uid()
    )) WITH CHECK (patient_id IN (
        SELECT id FROM patient_profiles WHERE user_id = auth.uid()
    ));
CREATE POLICY "Coadmins can view patient dizziness records" ON public.dizziness_records
    FOR SELECT USING (patient_id IN (
        SELECT patient_id FROM coadmin_profiles WHERE user_id = auth.uid()
    ));

-- ----------------------------------------
-- notification_preferences: User CRUD propio
-- ----------------------------------------
CREATE POLICY "Users manage own notification preferences" ON public.notification_preferences
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------
-- ai_call_schedules: Patient CRUD, Coadmin CRUD
-- ----------------------------------------
CREATE POLICY "Patients can manage own call schedules" ON public.ai_call_schedules
    FOR ALL USING (patient_id IN (
        SELECT id FROM patient_profiles WHERE user_id = auth.uid()
    )) WITH CHECK (patient_id IN (
        SELECT id FROM patient_profiles WHERE user_id = auth.uid()
    ));
CREATE POLICY "Coadmins can manage patient call schedules" ON public.ai_call_schedules
    FOR ALL USING (patient_id IN (
        SELECT patient_id FROM coadmin_profiles WHERE user_id = auth.uid()
    )) WITH CHECK (patient_id IN (
        SELECT patient_id FROM coadmin_profiles WHERE user_id = auth.uid()
    ));

-- ============================================
-- FIN DEL ESQUEMA
-- ============================================
