'use client'

/**
 * Hook para manejar el usuario actual
 * Lee el rol y patientId de localStorage
 */

import { useState, useEffect, useCallback } from 'react'
import type { UserRole } from '@/app/types/diabetes'

interface CurrentUser {
  role: UserRole | null
  patientId: string | null
}

const STORAGE_KEY_ROLE = 'murphy-user-role'
const STORAGE_KEY_PATIENT_ID = 'murphy-patient-id'

/**
 * Hook para obtener y manejar el usuario actual
 */
export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser>({
    role: null,
    patientId: null,
  })
  const [isLoading, setIsLoading] = useState(true)

  // Load from localStorage on mount
  useEffect(() => {
    const role = localStorage.getItem(STORAGE_KEY_ROLE) as UserRole | null
    const patientId = localStorage.getItem(STORAGE_KEY_PATIENT_ID)
    
    setUser({
      role,
      patientId,
    })
    setIsLoading(false)
  }, [])

  // Set role
  const setRole = useCallback((role: UserRole) => {
    localStorage.setItem(STORAGE_KEY_ROLE, role)
    setUser(prev => ({ ...prev, role }))
  }, [])

  // Set patient ID
  const setPatientId = useCallback((patientId: string) => {
    localStorage.setItem(STORAGE_KEY_PATIENT_ID, patientId)
    setUser(prev => ({ ...prev, patientId }))
  }, [])

  // Clear user data (logout)
  const clearUser = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY_ROLE)
    localStorage.removeItem(STORAGE_KEY_PATIENT_ID)
    setUser({ role: null, patientId: null })
  }, [])

  return {
    ...user,
    isLoading,
    setRole,
    setPatientId,
    clearUser,
  }
}
