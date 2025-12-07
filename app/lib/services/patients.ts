/**
 * Servicios de datos para el frontend
 * Obtiene datos de Supabase y los transforma al formato del frontend
 */

import { supabase } from '../supabase'
import { 
  mapPatient, 
  mapPatientBasic,
  type SupabasePatient,
  type SupabaseGlucometry,
  type SupabaseInsulinDose,
  type SupabaseSleepLog,
  type SupabaseSymptomLog,
  type SupabaseAlert,
  type SupabaseTreatmentSchedule,
} from '../mappers/patient'
import type { Patient } from '@/app/types/diabetes'

// ============================================
// Patient Types for Create/Update
// ============================================

export interface CreatePatientInput {
  name: string
  phone: string
  age?: number | null
  sex?: string | null
  diabetes_type?: string | null
  diagnosis_year?: number | null
  residence?: string | null
  socioeconomic_level?: number | null
  timezone?: string | null
}

export interface UpdatePatientInput {
  name?: string
  phone?: string
  age?: number | null
  sex?: string | null
  diabetes_type?: string | null
  diagnosis_year?: number | null
  residence?: string | null
  socioeconomic_level?: number | null
  timezone?: string | null
}

// ============================================
// Patient Services
// ============================================

/**
 * Crea un nuevo paciente
 */
export async function createPatient(input: CreatePatientInput): Promise<SupabasePatient | null> {
  const { data, error } = await supabase
    .from('patients')
    .insert({
      name: input.name,
      phone: input.phone,
      age: input.age ?? null,
      sex: input.sex ?? null,
      diabetes_type: input.diabetes_type ?? null,
      diagnosis_year: input.diagnosis_year ?? null,
      residence: input.residence ?? null,
      socioeconomic_level: input.socioeconomic_level ?? null,
      timezone: input.timezone ?? 'America/Bogota',
    })
    .select('id, name, phone, age, sex, diabetes_type, diagnosis_year, residence, socioeconomic_level, timezone')
    .single()

  if (error) {
    console.error('[SERVICE] Error creating patient:', error)
    return null
  }

  return data as SupabasePatient
}

/**
 * Elimina un paciente y todos sus datos relacionados
 * Las foreign keys con ON DELETE CASCADE eliminan automáticamente los registros relacionados
 */
export async function deletePatient(patientId: string): Promise<boolean> {
  const { error } = await supabase
    .from('patients')
    .delete()
    .eq('id', patientId)

  if (error) {
    console.error('[SERVICE] Error deleting patient:', error)
    return false
  }

  return true
}

/**
 * Actualiza un paciente existente
 */
export async function updatePatient(patientId: string, input: UpdatePatientInput): Promise<SupabasePatient | null> {
  // Build update object only with defined values
  const updateData: Record<string, unknown> = {}
  
  if (input.name !== undefined) updateData.name = input.name
  if (input.phone !== undefined) updateData.phone = input.phone
  if (input.age !== undefined) updateData.age = input.age
  if (input.sex !== undefined) updateData.sex = input.sex
  if (input.diabetes_type !== undefined) updateData.diabetes_type = input.diabetes_type
  if (input.diagnosis_year !== undefined) updateData.diagnosis_year = input.diagnosis_year
  if (input.residence !== undefined) updateData.residence = input.residence
  if (input.socioeconomic_level !== undefined) updateData.socioeconomic_level = input.socioeconomic_level
  if (input.timezone !== undefined) updateData.timezone = input.timezone

  const { data, error } = await supabase
    .from('patients')
    .update(updateData)
    .eq('id', patientId)
    .select('id, name, phone, age, sex, diabetes_type, diagnosis_year, residence, socioeconomic_level, timezone, telegram_id, doctor_id, created_at')
    .single()

  if (error) {
    console.error('[SERVICE] Error updating patient:', error)
    return null
  }

  return data as SupabasePatient
}

/**
 * Obtiene un paciente por teléfono
 */
export async function getPatientByPhone(phone: string): Promise<SupabasePatient | null> {
  const { data, error } = await supabase
    .from('patients')
    .select('id, name, phone, age, sex, diabetes_type, diagnosis_year, residence, socioeconomic_level, timezone, telegram_id, doctor_id, created_at')
    .eq('phone', phone)
    .single()

  if (error) {
    if (error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('[SERVICE] Error fetching patient by phone:', error)
    }
    return null
  }

  return data as SupabasePatient
}

/**
 * Obtiene un paciente por ID (datos básicos de Supabase)
 */
export async function getPatientById(patientId: string): Promise<SupabasePatient | null> {
  const { data, error } = await supabase
    .from('patients')
    .select('id, name, phone, age, sex, diabetes_type, diagnosis_year, residence, socioeconomic_level, timezone, telegram_id, doctor_id, created_at')
    .eq('id', patientId)
    .single()

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('[SERVICE] Error fetching patient:', error)
    }
    return null
  }

  return data as SupabasePatient
}

/**
 * Obtiene el primer paciente de la base de datos (útil para desarrollo)
 */
export async function getFirstPatient(): Promise<SupabasePatient | null> {
  const { data, error } = await supabase
    .from('patients')
    .select('id, name, phone, age, sex, diabetes_type, diagnosis_year, residence, socioeconomic_level, timezone, telegram_id, doctor_id, created_at')
    .order('name')
    .limit(1)
    .single()

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('[SERVICE] Error fetching first patient:', error)
    }
    return null
  }

  return data as SupabasePatient
}

/**
 * Obtiene todos los pacientes (solo datos básicos)
 */
export async function getAllPatients(): Promise<Patient[]> {
  const { data, error } = await supabase
    .from('patients')
    .select('id, name, phone, age, sex, diabetes_type, diagnosis_year, residence, socioeconomic_level, timezone, telegram_id, doctor_id, created_at')
    .order('name')

  if (error) {
    console.error('[SERVICE] Error fetching patients:', error)
    return []
  }

  return (data as SupabasePatient[]).map(mapPatientBasic)
}

/**
 * Obtiene un paciente por ID con todos sus datos relacionados
 * @param patientId - ID del paciente
 * @param daysBack - Días hacia atrás para obtener datos históricos (default: 30)
 */
export async function getPatientWithData(patientId: string, daysBack: number = 30): Promise<Patient | null> {
  // Fetch patient
  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .select('id, name, phone, age, sex, diabetes_type, diagnosis_year, residence, socioeconomic_level, timezone, telegram_id, doctor_id, created_at')
    .eq('id', patientId)
    .single()

  if (patientError || !patient) {
    // PGRST116 = no rows found, not a real error
    if (patientError?.code !== 'PGRST116') {
      console.error('[SERVICE] Error fetching patient:', patientError)
    }
    return null
  }

  // Fetch all related data in parallel
  const [glucometries, insulinDoses, sleepLogs, symptomLogs, alerts, treatmentSchedule] = await Promise.all([
    getPatientGlucometries(patientId, daysBack),
    getPatientInsulinDoses(patientId, daysBack),
    getPatientSleepLogs(patientId, daysBack),
    getPatientSymptomLogs(patientId, daysBack),
    getPatientAlerts(patientId),
    getPatientTreatmentSchedule(patientId),
  ])

  return mapPatient(
    patient as SupabasePatient,
    glucometries,
    insulinDoses,
    sleepLogs,
    symptomLogs,
    alerts,
    treatmentSchedule
  )
}

/**
 * Obtiene múltiples pacientes con todos sus datos
 */
export async function getPatientsWithData(patientIds?: string[]): Promise<Patient[]> {
  // Fetch patients
  let query = supabase
    .from('patients')
    .select('id, name, phone, age, sex, diabetes_type, diagnosis_year, residence, socioeconomic_level, timezone, telegram_id, doctor_id, created_at')
    .order('name')

  if (patientIds && patientIds.length > 0) {
    query = query.in('id', patientIds)
  }

  const { data: patients, error } = await query

  if (error || !patients) {
    console.error('[SERVICE] Error fetching patients:', error)
    return []
  }

  // Fetch data for each patient
  const patientsWithData = await Promise.all(
    patients.map(async (patient) => {
      const [glucometries, insulinDoses, sleepLogs, symptomLogs, alerts, treatmentSchedule] = await Promise.all([
        getPatientGlucometries(patient.id),
        getPatientInsulinDoses(patient.id),
        getPatientSleepLogs(patient.id),
        getPatientSymptomLogs(patient.id),
        getPatientAlerts(patient.id),
        getPatientTreatmentSchedule(patient.id),
      ])

      return mapPatient(
        patient as SupabasePatient,
        glucometries,
        insulinDoses,
        sleepLogs,
        symptomLogs,
        alerts,
        treatmentSchedule
      )
    })
  )

  return patientsWithData
}

// ============================================
// Related Data Services
// ============================================

/**
 * Obtiene glucometrías de un paciente (últimos 30 días por defecto)
 */
export async function getPatientGlucometries(
  patientId: string, 
  daysBack: number = 30
): Promise<SupabaseGlucometry[]> {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - daysBack)

  const { data, error } = await supabase
    .from('glucometries')
    .select('id, patient_id, value, scheduled_time, measured_at, source')
    .eq('patient_id', patientId)
    .gte('measured_at', startDate.toISOString())
    .order('measured_at', { ascending: false })

  if (error) {
    console.error('[SERVICE] Error fetching glucometries:', error)
    return []
  }

  return data as SupabaseGlucometry[]
}

/**
 * Obtiene dosis de insulina de un paciente
 */
export async function getPatientInsulinDoses(
  patientId: string,
  daysBack: number = 30
): Promise<SupabaseInsulinDose[]> {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - daysBack)

  const { data, error } = await supabase
    .from('insulin_doses')
    .select('id, patient_id, dose, unit, scheduled_time, administered_at, source')
    .eq('patient_id', patientId)
    .gte('administered_at', startDate.toISOString())
    .order('administered_at', { ascending: false })

  if (error) {
    console.error('[SERVICE] Error fetching insulin doses:', error)
    return []
  }

  return data as SupabaseInsulinDose[]
}

/**
 * Obtiene registros de sueño de un paciente
 */
export async function getPatientSleepLogs(
  patientId: string,
  daysBack: number = 30
): Promise<SupabaseSleepLog[]> {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - daysBack)
  const startDateStr = startDate.toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('sleep_logs')
    .select('id, patient_id, hours, date, source')
    .eq('patient_id', patientId)
    .gte('date', startDateStr)
    .order('date', { ascending: false })

  if (error) {
    console.error('[SERVICE] Error fetching sleep logs:', error)
    return []
  }

  return data as SupabaseSleepLog[]
}

/**
 * Obtiene registros de síntomas de un paciente
 */
export async function getPatientSymptomLogs(
  patientId: string,
  daysBack: number = 30
): Promise<SupabaseSymptomLog[]> {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - daysBack)
  const startDateStr = startDate.toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('symptom_logs')
    .select('id, patient_id, symptom_type, value, date, source')
    .eq('patient_id', patientId)
    .gte('date', startDateStr)
    .order('date', { ascending: false })

  if (error) {
    console.error('[SERVICE] Error fetching symptom logs:', error)
    return []
  }

  return data as SupabaseSymptomLog[]
}

/**
 * Obtiene alertas/recordatorios de un paciente
 */
export async function getPatientAlerts(patientId: string): Promise<SupabaseAlert[]> {
  const { data, error } = await supabase
    .from('alerts')
    .select('id, patient_id, alert_type, scheduled_time, enabled, channel')
    .eq('patient_id', patientId)
    .order('scheduled_time')

  if (error) {
    // La tabla alerts puede no existir o estar vacía
    if (!error.message.includes('does not exist')) {
      console.error('[SERVICE] Error fetching alerts:', error)
    }
    return []
  }

  return data as SupabaseAlert[]
}

/**
 * Obtiene el treatment schedule de un paciente (slots configurados para glucosa e insulina)
 */
export async function getPatientTreatmentSchedule(patientId: string): Promise<SupabaseTreatmentSchedule[]> {
  const { data, error } = await supabase
    .from('treatment_schedule')
    .select('id, patient_id, type, scheduled_time, label, expected_dose, insulin_type, enabled, created_at')
    .eq('patient_id', patientId)
    .eq('enabled', true)
    .order('scheduled_time')

  if (error) {
    // La tabla treatment_schedule puede no existir o estar vacía
    if (!error.message.includes('does not exist')) {
      console.error('[SERVICE] Error fetching treatment schedule:', error)
    }
    return []
  }

  return data as SupabaseTreatmentSchedule[]
}
