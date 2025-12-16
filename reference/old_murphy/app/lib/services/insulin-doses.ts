/**
 * Servicios CRUD para dosis de insulina
 */

import { supabase } from '../supabase'
import type { SupabaseInsulinDose } from '../mappers/patient'

// ============================================
// Types
// ============================================

export interface CreateInsulinDoseInput {
  patient_id: string
  dose: number
  unit?: string
  scheduled_time: string  // "HH:MM:SS"
  administered_at: string // ISO timestamp
  source?: string
}

export interface UpdateInsulinDoseInput {
  dose?: number
  unit?: string
  scheduled_time?: string
  administered_at?: string
  source?: string
}

// ============================================
// CRUD Operations
// ============================================

/**
 * Crea una nueva dosis de insulina
 */
export async function createInsulinDose(input: CreateInsulinDoseInput): Promise<SupabaseInsulinDose | null> {
  const { data, error } = await supabase
    .from('insulin_doses')
    .insert({
      patient_id: input.patient_id,
      dose: input.dose,
      unit: input.unit ?? 'units',
      scheduled_time: input.scheduled_time,
      administered_at: input.administered_at,
      source: input.source ?? 'app',
    })
    .select('id, patient_id, dose, unit, scheduled_time, administered_at, source')
    .single()

  if (error) {
    console.error('[SERVICE] Error creating insulin dose:', error)
    return null
  }

  return data as SupabaseInsulinDose
}

/**
 * Obtiene una dosis de insulina por ID
 */
export async function getInsulinDoseById(id: string): Promise<SupabaseInsulinDose | null> {
  const { data, error } = await supabase
    .from('insulin_doses')
    .select('id, patient_id, dose, unit, scheduled_time, administered_at, source')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('[SERVICE] Error fetching insulin dose:', error)
    }
    return null
  }

  return data as SupabaseInsulinDose
}

/**
 * Obtiene dosis de insulina de un paciente
 */
export async function getInsulinDosesByPatient(
  patientId: string,
  options?: {
    daysBack?: number
    limit?: number
  }
): Promise<SupabaseInsulinDose[]> {
  let query = supabase
    .from('insulin_doses')
    .select('id, patient_id, dose, unit, scheduled_time, administered_at, source')
    .eq('patient_id', patientId)
    .order('administered_at', { ascending: false })

  if (options?.daysBack) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - options.daysBack)
    query = query.gte('administered_at', startDate.toISOString())
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('[SERVICE] Error fetching insulin doses:', error)
    return []
  }

  return data as SupabaseInsulinDose[]
}

/**
 * Actualiza una dosis de insulina
 */
export async function updateInsulinDose(
  id: string,
  input: UpdateInsulinDoseInput
): Promise<SupabaseInsulinDose | null> {
  const { data, error } = await supabase
    .from('insulin_doses')
    .update(input)
    .eq('id', id)
    .select('id, patient_id, dose, unit, scheduled_time, administered_at, source')
    .single()

  if (error) {
    console.error('[SERVICE] Error updating insulin dose:', error)
    return null
  }

  return data as SupabaseInsulinDose
}

/**
 * Elimina una dosis de insulina
 */
export async function deleteInsulinDose(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('insulin_doses')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[SERVICE] Error deleting insulin dose:', error)
    return false
  }

  return true
}

/**
 * Elimina todas las dosis de insulina de un paciente
 */
export async function deleteInsulinDosesByPatient(patientId: string): Promise<boolean> {
  const { error } = await supabase
    .from('insulin_doses')
    .delete()
    .eq('patient_id', patientId)

  if (error) {
    console.error('[SERVICE] Error deleting patient insulin doses:', error)
    return false
  }

  return true
}
