/**
 * Servicios CRUD para alertas (recordatorios que disparan notificaciones)
 * 
 * La tabla alerts en Supabase:
 * - id: UUID
 * - patient_id: UUID (FK a patients)
 * - alert_type: 'glucometry' | 'insulin'
 * - scheduled_time: TIME (HH:MM:SS)
 * - enabled: boolean
 * - channel: 'whatsapp' | 'call'
 * - created_at: TIMESTAMPTZ
 */

import { supabase } from '../supabase'

// ============================================
// Types
// ============================================

export type AlertType = 'glucometry' | 'insulin'
export type AlertChannel = 'whatsapp' | 'call'

export interface SupabaseAlert {
  id: string
  patient_id: string
  alert_type: AlertType
  scheduled_time: string  // "HH:MM:SS"
  enabled: boolean
  channel: AlertChannel
  created_at: string
}

export interface CreateAlertInput {
  patient_id: string
  alert_type: AlertType
  scheduled_time: string  // "HH:MM:SS"
  channel?: AlertChannel
  enabled?: boolean
}

export interface UpdateAlertInput {
  alert_type?: AlertType
  scheduled_time?: string
  channel?: AlertChannel
  enabled?: boolean
}

// Select fields for queries
const ALERT_SELECT_FIELDS = 'id, patient_id, alert_type, scheduled_time, enabled, channel, created_at'

// ============================================
// CRUD Operations
// ============================================

/**
 * Crea una nueva alerta
 */
export async function createAlert(input: CreateAlertInput): Promise<SupabaseAlert | null> {
  const { data, error } = await supabase
    .from('alerts')
    .insert({
      patient_id: input.patient_id,
      alert_type: input.alert_type,
      scheduled_time: input.scheduled_time,
      channel: input.channel ?? 'whatsapp',
      enabled: input.enabled ?? true,
    })
    .select(ALERT_SELECT_FIELDS)
    .single()

  if (error) {
    // Unique constraint violation - alert already exists
    if (error.code === '23505') {
      console.log('[ALERTS] Alert already exists for this patient/type/time')
      return null
    }
    console.error('[ALERTS] Error creating alert:', error)
    return null
  }

  return data as SupabaseAlert
}

/**
 * Obtiene una alerta por ID
 */
export async function getAlertById(id: string): Promise<SupabaseAlert | null> {
  const { data, error } = await supabase
    .from('alerts')
    .select(ALERT_SELECT_FIELDS)
    .eq('id', id)
    .single()

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('[ALERTS] Error fetching alert:', error)
    }
    return null
  }

  return data as SupabaseAlert
}

/**
 * Obtiene alertas de un paciente
 */
export async function getAlertsByPatient(
  patientId: string,
  options?: {
    alertType?: AlertType
    enabledOnly?: boolean
  }
): Promise<SupabaseAlert[]> {
  let query = supabase
    .from('alerts')
    .select(ALERT_SELECT_FIELDS)
    .eq('patient_id', patientId)
    .order('scheduled_time')

  if (options?.alertType) {
    query = query.eq('alert_type', options.alertType)
  }

  if (options?.enabledOnly) {
    query = query.eq('enabled', true)
  }

  const { data, error } = await query

  if (error) {
    console.error('[ALERTS] Error fetching alerts:', error)
    return []
  }

  return data as SupabaseAlert[]
}

/**
 * Busca una alerta por paciente, tipo y horario
 * Útil para verificar si ya existe una alerta para un slot de treatment_schedule
 */
export async function findAlert(
  patientId: string,
  alertType: AlertType,
  scheduledTime: string
): Promise<SupabaseAlert | null> {
  const { data, error } = await supabase
    .from('alerts')
    .select(ALERT_SELECT_FIELDS)
    .eq('patient_id', patientId)
    .eq('alert_type', alertType)
    .eq('scheduled_time', scheduledTime)
    .single()

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('[ALERTS] Error finding alert:', error)
    }
    return null
  }

  return data as SupabaseAlert
}

/**
 * Actualiza una alerta
 */
export async function updateAlert(
  id: string,
  input: UpdateAlertInput
): Promise<SupabaseAlert | null> {
  const { data, error } = await supabase
    .from('alerts')
    .update(input)
    .eq('id', id)
    .select(ALERT_SELECT_FIELDS)
    .single()

  if (error) {
    console.error('[ALERTS] Error updating alert:', error)
    return null
  }

  return data as SupabaseAlert
}

/**
 * Habilita/deshabilita una alerta
 */
export async function toggleAlert(id: string, enabled: boolean): Promise<boolean> {
  const { error } = await supabase
    .from('alerts')
    .update({ enabled })
    .eq('id', id)

  if (error) {
    console.error('[ALERTS] Error toggling alert:', error)
    return false
  }

  return true
}

/**
 * Elimina una alerta
 */
export async function deleteAlert(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('alerts')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('[ALERTS] Error deleting alert:', error)
    return false
  }

  return true
}

/**
 * Elimina una alerta por paciente, tipo y horario
 */
export async function deleteAlertBySchedule(
  patientId: string,
  alertType: AlertType,
  scheduledTime: string
): Promise<boolean> {
  const { error } = await supabase
    .from('alerts')
    .delete()
    .eq('patient_id', patientId)
    .eq('alert_type', alertType)
    .eq('scheduled_time', scheduledTime)

  if (error) {
    console.error('[ALERTS] Error deleting alert by schedule:', error)
    return false
  }

  return true
}
