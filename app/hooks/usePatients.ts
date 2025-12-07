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
 * @param patientId - ID del paciente
 * @param daysBack - Días hacia atrás para obtener datos históricos (default: 30)
 */
export function usePatient(patientId: string | null, daysBack: number = 30) {
  return useQuery<Patient | null>({
    queryKey: ['patient', patientId, daysBack],
    queryFn: () => patientId ? fetchPatientWithData(patientId, daysBack) : null,
    enabled: !!patientId,
    staleTime: 30 * 1000, // 30 segundos
    refetchInterval: 30 * 1000, // Refrescar cada 30 segundos
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
