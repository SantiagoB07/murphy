/**
 * Servicios CRUD para glucometrías
 */

import { supabase } from '../supabase'
import type { SupabaseGlucometry } from '../mappers/patient'

// ============================================
// Types
// ============================================

export interface CreateGlucometryInput {
  patient_id: string
  value: number
  scheduled_time: string  // "HH:MM:SS"
  measured_at: string     // ISO timestamp
  source?: string
}

export interface UpdateGlucometryInput {
  value?: number
  scheduled_time?: string
  measured_at?: string
  source?: string
}

// ============================================
// CRUD Operations
// ============================================

/**
 * Crea una nueva glucometría
 */
export async function createGlucometry(input: CreateGlucometryInput): Promise<SupabaseGlucometry | null> {
  const { data, error } = await supabase
    .from('glucometries')
    .insert({
      patient_id: input.patient_id,
      value: input.value,
      scheduled_time: input.scheduled_time,
      measured_at: input.measured_at,
      source: input.source ?? 'app',
    })
    .select('id, patient_id, value, scheduled_time, measured_at, source')
    .single()

  if (error) {
    console.error('[SERVICE] Error creating glucometry:', error)
    return null
  }

  return data as SupabaseGlucometry
}

/**
 * Obtiene una glucometría por ID
 */
export async function getGlucometryById(id: string): Promise<SupabaseGlucometry | null> {
  const { data, error } = await supabase
    .from('glucometries')
    .select('id, patient_id, value, scheduled_time, measured_at, source')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('[SERVICE] Error fetching glucometry:', error)
    }
    return null
  }

  return data as SupabaseGlucometry
}

/**
 * Obtiene glucometrías de un paciente
 */
export async function getGlucometriesByPatient(
  patientId: string,
  options?: {
    daysBack?: number
    limit?: number
  }
): Promise<SupabaseGlucometry[]> {
  let query = supabase
    .from('glucometries')
    .select('id, patient_id, value, scheduled_time, measured_at, source')
    .eq('patient_id', patientId)
    .order('measured_at', { ascending: false })

  if (options?.daysBack) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - options.daysBack)
    query = query.gte('measured_at', startDate.toISOString())
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('[SERVICE] Error fetching glucometries:', error)
    return []
  }

  return data as SupabaseGlucometry[]
}

/**
 * Actualiza una glucometría
 */
export async function updateGlucometry(
  id: string,
  input: UpdateGlucometryInput
): Promise<SupabaseGlucometry | null> {
  const { data, error } = await supabase
    .from('glucometries')
    .update(input)
    .eq('id', id)
    .select('id, patient_id, value, scheduled_time, measured_at, source')
    .single()

  if (error) {
    console.error('[SERVICE] Error updating glucometry:', error)
    return null
  }

  return data as SupabaseGlucometry
}

/**
 * Elimina una glucometría
 */
export async function deleteGlucometry(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('glucometries')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[SERVICE] Error deleting glucometry:', error)
    return false
  }

  return true
}

/**
 * Elimina todas las glucometrías de un paciente
 */
export async function deleteGlucometriesByPatient(patientId: string): Promise<boolean> {
  const { error } = await supabase
    .from('glucometries')
    .delete()
    .eq('patient_id', patientId)

  if (error) {
    console.error('[SERVICE] Error deleting patient glucometries:', error)
    return false
  }

  return true
}
