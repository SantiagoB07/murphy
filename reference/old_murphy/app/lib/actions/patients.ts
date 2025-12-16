'use server'

/**
 * Server Actions para obtener datos de pacientes
 * Estas funciones se ejecutan en el servidor y pueden acceder a Supabase
 */

import { 
  getAllPatients, 
  getPatientWithData, 
  getPatientsWithData,
  createPatient as createPatientService,
  updatePatient as updatePatientService,
  type CreatePatientInput,
  type UpdatePatientInput,
} from '@/app/lib/services/patients'
import {
  createCoadmin as createCoadminService,
  type CreateCoadminInput,
} from '@/app/lib/services/coadmins'
import type { Patient } from '@/app/types/diabetes'
import type { SupabasePatient } from '@/app/lib/mappers/patient'
import type { SupabaseCoadmin } from '@/app/lib/services/coadmins'

/**
 * Obtiene todos los pacientes (datos básicos)
 */
export async function fetchAllPatients(): Promise<Patient[]> {
  return getAllPatients()
}

/**
 * Obtiene un paciente por ID con todos sus datos
 * @param patientId - ID del paciente
 * @param daysBack - Días hacia atrás para obtener datos históricos (default: 30)
 */
export async function fetchPatientWithData(patientId: string, daysBack: number = 30): Promise<Patient | null> {
  return getPatientWithData(patientId, daysBack)
}

/**
 * Obtiene múltiples pacientes con todos sus datos
 */
export async function fetchPatientsWithData(patientIds?: string[]): Promise<Patient[]> {
  return getPatientsWithData(patientIds)
}

/**
 * Crea un nuevo paciente
 */
export async function createPatient(input: CreatePatientInput): Promise<SupabasePatient | null> {
  return createPatientService(input)
}

/**
 * Crea un nuevo coadmin
 */
export async function createCoadmin(input: CreateCoadminInput): Promise<SupabaseCoadmin | null> {
  return createCoadminService(input)
}

/**
 * Actualiza un paciente existente
 */
export async function updatePatient(patientId: string, input: UpdatePatientInput): Promise<SupabasePatient | null> {
  return updatePatientService(patientId, input)
}
