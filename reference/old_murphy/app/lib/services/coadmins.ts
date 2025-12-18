/**
 * Servicios CRUD para coadmins
 */

import { supabase } from '../supabase'

// ============================================
// Coadmin Types
// ============================================

export interface SupabaseCoadmin {
  id: string
  name: string
  phone: string
  telegram_id: string | null
  patient_id: string
  created_at: string
}

export interface CreateCoadminInput {
  name: string
  phone: string
  patient_id: string
  telegram_id?: string | null
}

// ============================================
// Coadmin Services
// ============================================

/**
 * Crea un nuevo coadmin asociado a un paciente
 */
export async function createCoadmin(input: CreateCoadminInput): Promise<SupabaseCoadmin | null> {
  const { data, error } = await supabase
    .from('coadmins')
    .insert({
      name: input.name,
      phone: input.phone,
      patient_id: input.patient_id,
      telegram_id: input.telegram_id ?? null,
    })
    .select('id, name, phone, telegram_id, patient_id, created_at')
    .single()

  if (error) {
    console.error('[SERVICE] Error creating coadmin:', error)
    return null
  }

  return data as SupabaseCoadmin
}

/**
 * Obtiene todos los coadmins de un paciente
 */
export async function getCoadminsByPatient(patientId: string): Promise<SupabaseCoadmin[]> {
  const { data, error } = await supabase
    .from('coadmins')
    .select('id, name, phone, telegram_id, patient_id, created_at')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[SERVICE] Error fetching coadmins:', error)
    return []
  }

  return data as SupabaseCoadmin[]
}

/**
 * Obtiene un coadmin por ID
 */
export async function getCoadminById(coadminId: string): Promise<SupabaseCoadmin | null> {
  const { data, error } = await supabase
    .from('coadmins')
    .select('id, name, phone, telegram_id, patient_id, created_at')
    .eq('id', coadminId)
    .single()

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('[SERVICE] Error fetching coadmin:', error)
    }
    return null
  }

  return data as SupabaseCoadmin
}

/**
 * Obtiene un coadmin por teléfono
 */
export async function getCoadminByPhone(phone: string): Promise<SupabaseCoadmin | null> {
  const { data, error } = await supabase
    .from('coadmins')
    .select('id, name, phone, telegram_id, patient_id, created_at')
    .eq('phone', phone)
    .single()

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('[SERVICE] Error fetching coadmin by phone:', error)
    }
    return null
  }

  return data as SupabaseCoadmin
}

/**
 * Elimina un coadmin
 */
export async function deleteCoadmin(coadminId: string): Promise<boolean> {
  const { error } = await supabase
    .from('coadmins')
    .delete()
    .eq('id', coadminId)

  if (error) {
    console.error('[SERVICE] Error deleting coadmin:', error)
    return false
  }

  return true
}
