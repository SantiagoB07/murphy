/**
 * Servicios CRUD para registros de sueño
 */

import { supabase } from '../supabase'
import type { SupabaseSleepLog } from '../mappers/patient'

// ============================================
// Types
// ============================================

export interface CreateSleepLogInput {
  patient_id: string
  hours: number
  date: string  // "YYYY-MM-DD"
  source?: string
}

export interface UpdateSleepLogInput {
  hours?: number
  date?: string
  source?: string
}

// ============================================
// CRUD Operations
// ============================================

/**
 * Crea un nuevo registro de sueño
 */
export async function createSleepLog(input: CreateSleepLogInput): Promise<SupabaseSleepLog | null> {
  const { data, error } = await supabase
    .from('sleep_logs')
    .insert({
      patient_id: input.patient_id,
      hours: input.hours,
      date: input.date,
      source: input.source ?? 'app',
    })
    .select('id, patient_id, hours, date, source')
    .single()

  if (error) {
    console.error('[SERVICE] Error creating sleep log:', error)
    return null
  }

  return data as SupabaseSleepLog
}

/**
 * Obtiene un registro de sueño por ID
 */
export async function getSleepLogById(id: string): Promise<SupabaseSleepLog | null> {
  const { data, error } = await supabase
    .from('sleep_logs')
    .select('id, patient_id, hours, date, source')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('[SERVICE] Error fetching sleep log:', error)
    }
    return null
  }

  return data as SupabaseSleepLog
}

/**
 * Obtiene registros de sueño de un paciente
 */
export async function getSleepLogsByPatient(
  patientId: string,
  options?: {
    daysBack?: number
    limit?: number
  }
): Promise<SupabaseSleepLog[]> {
  let query = supabase
    .from('sleep_logs')
    .select('id, patient_id, hours, date, source')
    .eq('patient_id', patientId)
    .order('date', { ascending: false })

  if (options?.daysBack) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - options.daysBack)
    const startDateStr = startDate.toISOString().split('T')[0]
    query = query.gte('date', startDateStr)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('[SERVICE] Error fetching sleep logs:', error)
    return []
  }

  return data as SupabaseSleepLog[]
}

/**
 * Obtiene el registro de sueño de un paciente para una fecha específica
 */
export async function getSleepLogByDate(
  patientId: string,
  date: string
): Promise<SupabaseSleepLog | null> {
  const { data, error } = await supabase
    .from('sleep_logs')
    .select('id, patient_id, hours, date, source')
    .eq('patient_id', patientId)
    .eq('date', date)
    .single()

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('[SERVICE] Error fetching sleep log by date:', error)
    }
    return null
  }

  return data as SupabaseSleepLog
}

/**
 * Actualiza un registro de sueño
 */
export async function updateSleepLog(
  id: string,
  input: UpdateSleepLogInput
): Promise<SupabaseSleepLog | null> {
  const { data, error } = await supabase
    .from('sleep_logs')
    .update(input)
    .eq('id', id)
    .select('id, patient_id, hours, date, source')
    .single()

  if (error) {
    console.error('[SERVICE] Error updating sleep log:', error)
    return null
  }

  return data as SupabaseSleepLog
}

/**
 * Elimina un registro de sueño
 */
export async function deleteSleepLog(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('sleep_logs')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[SERVICE] Error deleting sleep log:', error)
    return false
  }

  return true
}

/**
 * Elimina todos los registros de sueño de un paciente
 */
export async function deleteSleepLogsByPatient(patientId: string): Promise<boolean> {
  const { error } = await supabase
    .from('sleep_logs')
    .delete()
    .eq('patient_id', patientId)

  if (error) {
    console.error('[SERVICE] Error deleting patient sleep logs:', error)
    return false
  }

  return true
}
