/**
 * Servicios CRUD para treatment schedule (configuración del régimen de tratamiento)
 */

import { supabase } from '../supabase'
import type { SupabaseTreatmentSchedule } from '../mappers/patient'

// ============================================
// Types
// ============================================

export type TreatmentType = 'glucose' | 'insulin'
export type InsulinType = 'rapid' | 'basal'

export interface CreateTreatmentSlotInput {
  patient_id: string
  type: TreatmentType
  scheduled_time: string  // "HH:MM:SS"
  label?: string | null
  expected_dose?: number | null
  insulin_type?: InsulinType | null
  enabled?: boolean
}

export interface UpdateTreatmentSlotInput {
  type?: TreatmentType
  scheduled_time?: string
  label?: string | null
  expected_dose?: number | null
  insulin_type?: InsulinType | null
  enabled?: boolean
}

// ============================================
// CRUD Operations
// ============================================

/**
 * Crea un nuevo slot de tratamiento
 */
export async function createTreatmentSlot(input: CreateTreatmentSlotInput): Promise<SupabaseTreatmentSchedule | null> {
  const { data, error } = await supabase
    .from('treatment_schedule')
    .insert({
      patient_id: input.patient_id,
      type: input.type,
      scheduled_time: input.scheduled_time,
      label: input.label ?? null,
      expected_dose: input.expected_dose ?? null,
      insulin_type: input.insulin_type ?? null,
      enabled: input.enabled ?? true,
    })
    .select('id, patient_id, type, scheduled_time, label, expected_dose, insulin_type, enabled, created_at')
    .single()

  if (error) {
    console.error('[SERVICE] Error creating treatment slot:', error)
    return null
  }

  return data as SupabaseTreatmentSchedule
}

/**
 * Obtiene un slot de tratamiento por ID
 */
export async function getTreatmentSlotById(id: string): Promise<SupabaseTreatmentSchedule | null> {
  const { data, error } = await supabase
    .from('treatment_schedule')
    .select('id, patient_id, type, scheduled_time, label, expected_dose, insulin_type, enabled, created_at')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('[SERVICE] Error fetching treatment slot:', error)
    }
    return null
  }

  return data as SupabaseTreatmentSchedule
}

/**
 * Obtiene slots de tratamiento de un paciente
 */
export async function getTreatmentSlotsByPatient(
  patientId: string,
  options?: {
    type?: TreatmentType
    enabledOnly?: boolean
  }
): Promise<SupabaseTreatmentSchedule[]> {
  let query = supabase
    .from('treatment_schedule')
    .select('id, patient_id, type, scheduled_time, label, expected_dose, insulin_type, enabled, created_at')
    .eq('patient_id', patientId)
    .order('scheduled_time')

  if (options?.type) {
    query = query.eq('type', options.type)
  }

  if (options?.enabledOnly) {
    query = query.eq('enabled', true)
  }

  const { data, error } = await query

  if (error) {
    console.error('[SERVICE] Error fetching treatment slots:', error)
    return []
  }

  return data as SupabaseTreatmentSchedule[]
}

/**
 * Obtiene slots de glucosa de un paciente
 */
export async function getGlucoseSlotsByPatient(
  patientId: string,
  enabledOnly: boolean = true
): Promise<SupabaseTreatmentSchedule[]> {
  return getTreatmentSlotsByPatient(patientId, { type: 'glucose', enabledOnly })
}

/**
 * Obtiene slots de insulina de un paciente
 */
export async function getInsulinSlotsByPatient(
  patientId: string,
  enabledOnly: boolean = true
): Promise<SupabaseTreatmentSchedule[]> {
  return getTreatmentSlotsByPatient(patientId, { type: 'insulin', enabledOnly })
}

/**
 * Actualiza un slot de tratamiento
 */
export async function updateTreatmentSlot(
  id: string,
  input: UpdateTreatmentSlotInput
): Promise<SupabaseTreatmentSchedule | null> {
  const { data, error } = await supabase
    .from('treatment_schedule')
    .update(input)
    .eq('id', id)
    .select('id, patient_id, type, scheduled_time, label, expected_dose, insulin_type, enabled, created_at')
    .single()

  if (error) {
    console.error('[SERVICE] Error updating treatment slot:', error)
    return null
  }

  return data as SupabaseTreatmentSchedule
}

/**
 * Habilita/deshabilita un slot de tratamiento
 */
export async function toggleTreatmentSlot(id: string, enabled: boolean): Promise<boolean> {
  const { error } = await supabase
    .from('treatment_schedule')
    .update({ enabled })
    .eq('id', id)

  if (error) {
    console.error('[SERVICE] Error toggling treatment slot:', error)
    return false
  }

  return true
}

/**
 * Elimina un slot de tratamiento
 */
export async function deleteTreatmentSlot(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('treatment_schedule')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[SERVICE] Error deleting treatment slot:', error)
    return false
  }

  return true
}

/**
 * Elimina todos los slots de tratamiento de un paciente
 */
export async function deleteTreatmentSlotsByPatient(patientId: string): Promise<boolean> {
  const { error } = await supabase
    .from('treatment_schedule')
    .delete()
    .eq('patient_id', patientId)

  if (error) {
    console.error('[SERVICE] Error deleting patient treatment slots:', error)
    return false
  }

  return true
}
