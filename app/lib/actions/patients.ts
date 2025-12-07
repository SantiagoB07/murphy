'use server'

/**
 * Server Actions para obtener datos de pacientes
 * Estas funciones se ejecutan en el servidor y pueden acceder a Supabase
 */

import { 
  getAllPatients, 
  getPatientWithData, 
  getPatientsWithData 
} from '@/app/lib/services/patients'
import type { Patient } from '@/app/types/diabetes'

/**
 * Obtiene todos los pacientes (datos básicos)
 */
export async function fetchAllPatients(): Promise<Patient[]> {
  return getAllPatients()
}

/**
 * Obtiene un paciente por ID con todos sus datos
 */
export async function fetchPatientWithData(patientId: string): Promise<Patient | null> {
  return getPatientWithData(patientId)
}

/**
 * Obtiene múltiples pacientes con todos sus datos
 */
export async function fetchPatientsWithData(patientIds?: string[]): Promise<Patient[]> {
  return getPatientsWithData(patientIds)
}
