'use client'

/**
 * Hooks para obtener datos de pacientes
 * Usa React Query para caching y estado de loading
 */

import { useQuery } from '@tanstack/react-query'
import { 
  fetchAllPatients, 
  fetchPatientWithData, 
  fetchPatientsWithData 
} from '@/app/lib/actions/patients'
import type { Patient } from '@/app/types/diabetes'

/**
 * Hook para obtener todos los pacientes (datos básicos)
 */
export function usePatients() {
  return useQuery<Patient[]>({
    queryKey: ['patients'],
    queryFn: () => fetchAllPatients(),
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

/**
 * Hook para obtener un paciente por ID con todos sus datos
 */
export function usePatient(patientId: string | null) {
  return useQuery<Patient | null>({
    queryKey: ['patient', patientId],
    queryFn: () => patientId ? fetchPatientWithData(patientId) : null,
    enabled: !!patientId,
    staleTime: 2 * 60 * 1000, // 2 minutos
  })
}

/**
 * Hook para obtener múltiples pacientes con todos sus datos
 */
export function usePatientsWithData(patientIds?: string[]) {
  return useQuery<Patient[]>({
    queryKey: ['patients-with-data', patientIds],
    queryFn: () => fetchPatientsWithData(patientIds),
    staleTime: 2 * 60 * 1000, // 2 minutos
  })
}
