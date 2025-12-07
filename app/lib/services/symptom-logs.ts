/**
 * Servicios CRUD para registros de síntomas
 */

import { supabase } from '../supabase'
import type { SupabaseSymptomLog } from '../mappers/patient'

// ============================================
// Types
// ============================================

export type SymptomType = 'stress' | 'dizziness'

export interface CreateSymptomLogInput {
  patient_id: string
  symptom_type: SymptomType
  value: boolean
  date: string  // "YYYY-MM-DD"
  source?: string
}

export interface UpdateSymptomLogInput {
  symptom_type?: SymptomType
  value?: boolean
  date?: string
  source?: string
}

// ============================================
// CRUD Operations
// ============================================

/**
 * Crea un nuevo registro de síntoma
 */
export async function createSymptomLog(input: CreateSymptomLogInput): Promise<SupabaseSymptomLog | null> {
  const { data, error } = await supabase
    .from('symptom_logs')
    .insert({
      patient_id: input.patient_id,
      symptom_type: input.symptom_type,
      value: input.value,
      date: input.date,
      source: input.source ?? 'app',
    })
    .select('id, patient_id, symptom_type, value, date, source')
    .single()

  if (error) {
    console.error('[SERVICE] Error creating symptom log:', error)
    return null
  }

  return data as SupabaseSymptomLog
}

/**
 * Obtiene un registro de síntoma por ID
 */
export async function getSymptomLogById(id: string): Promise<SupabaseSymptomLog | null> {
  const { data, error } = await supabase
    .from('symptom_logs')
    .select('id, patient_id, symptom_type, value, date, source')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('[SERVICE] Error fetching symptom log:', error)
    }
    return null
  }

  return data as SupabaseSymptomLog
}

/**
 * Obtiene registros de síntomas de un paciente
 */
export async function getSymptomLogsByPatient(
  patientId: string,
  options?: {
    daysBack?: number
    symptomType?: SymptomType
    limit?: number
  }
): Promise<SupabaseSymptomLog[]> {
  let query = supabase
    .from('symptom_logs')
    .select('id, patient_id, symptom_type, value, date, source')
    .eq('patient_id', patientId)
    .order('date', { ascending: false })

  if (options?.daysBack) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - options.daysBack)
    const startDateStr = startDate.toISOString().split('T')[0]
    query = query.gte('date', startDateStr)
  }

  if (options?.symptomType) {
    query = query.eq('symptom_type', options.symptomType)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('[SERVICE] Error fetching symptom logs:', error)
    return []
  }

  return data as SupabaseSymptomLog[]
}

/**
 * Obtiene el registro de síntoma de un paciente para una fecha y tipo específicos
 */
export async function getSymptomLogByDateAndType(
  patientId: string,
  date: string,
  symptomType: SymptomType
): Promise<SupabaseSymptomLog | null> {
  const { data, error } = await supabase
    .from('symptom_logs')
    .select('id, patient_id, symptom_type, value, date, source')
    .eq('patient_id', patientId)
    .eq('date', date)
    .eq('symptom_type', symptomType)
    .single()

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('[SERVICE] Error fetching symptom log by date and type:', error)
    }
    return null
  }

  return data as SupabaseSymptomLog
}

/**
 * Actualiza un registro de síntoma
 */
export async function updateSymptomLog(
  id: string,
  input: UpdateSymptomLogInput
): Promise<SupabaseSymptomLog | null> {
  const { data, error } = await supabase
    .from('symptom_logs')
    .update(input)
    .eq('id', id)
    .select('id, patient_id, symptom_type, value, date, source')
    .single()

  if (error) {
    console.error('[SERVICE] Error updating symptom log:', error)
    return null
  }

  return data as SupabaseSymptomLog
}

/**
 * Elimina un registro de síntoma
 */
export async function deleteSymptomLog(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('symptom_logs')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[SERVICE] Error deleting symptom log:', error)
    return false
  }

  return true
}

/**
 * Elimina todos los registros de síntomas de un paciente
 */
export async function deleteSymptomLogsByPatient(patientId: string): Promise<boolean> {
  const { error } = await supabase
    .from('symptom_logs')
    .delete()
    .eq('patient_id', patientId)

  if (error) {
    console.error('[SERVICE] Error deleting patient symptom logs:', error)
    return false
  }

  return true
}
