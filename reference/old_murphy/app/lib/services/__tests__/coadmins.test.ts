/**
 * Tests de integración para el servicio de coadmins
 * 
 * Estos tests usan la base de datos real de Supabase
 * Cada test crea y elimina sus propios datos de prueba
 */

import { describe, it, expect, afterAll } from 'vitest'
import {
  createCoadmin,
  deleteCoadmin,
  getCoadminById,
  getCoadminByPhone,
  getCoadminsByPatient,
} from '../coadmins'
import { createPatient, deletePatient } from '../patients'

describe('coadmins service', () => {
  // Datos temporales para tests
  let testPatientId: string | null = null
  let testCoadminId: string | null = null
  const testPatientPhone = '+57COADTEST' + Date.now()
  const testCoadminPhone = '+57COADMIN' + Date.now()

  afterAll(async () => {
    // Limpiar coadmin de prueba si quedó
    if (testCoadminId) {
      await deleteCoadmin(testCoadminId)
    }
    // Limpiar paciente de prueba si quedó
    if (testPatientId) {
      await deletePatient(testPatientId)
    }
  })

  describe('createCoadmin', () => {
    it('should create a patient first (setup)', async () => {
      const patient = await createPatient({
        name: 'Test Patient for Coadmin',
        phone: testPatientPhone,
        age: 45,
        diabetes_type: 'Tipo 2',
      })

      expect(patient).not.toBeNull()
      testPatientId = patient!.id
    })

    it('should create a new coadmin', async () => {
      expect(testPatientId).not.toBeNull()

      const coadmin = await createCoadmin({
        name: 'Test Coadmin',
        phone: testCoadminPhone,
        patient_id: testPatientId!,
      })

      expect(coadmin).not.toBeNull()
      expect(coadmin!.name).toBe('Test Coadmin')
      expect(coadmin!.phone).toBe(testCoadminPhone)
      expect(coadmin!.patient_id).toBe(testPatientId)
      expect(coadmin!.id).toBeDefined()
      expect(coadmin!.created_at).toBeDefined()

      testCoadminId = coadmin!.id
    })

    it('should create coadmin with telegram_id', async () => {
      // Necesitamos un paciente diferente porque hay constraint de uno por paciente
      const telegramPatientPhone = '+57TELEGP' + Date.now()
      const telegramPatient = await createPatient({
        name: 'Telegram Patient',
        phone: telegramPatientPhone,
      })
      
      expect(telegramPatient).not.toBeNull()

      const telegramPhone = '+57TELEGRAM' + Date.now()
      const coadmin = await createCoadmin({
        name: 'Telegram Coadmin',
        phone: telegramPhone,
        patient_id: telegramPatient!.id,
        telegram_id: '123456789',
      })

      expect(coadmin).not.toBeNull()
      expect(coadmin!.telegram_id).toBe('123456789')

      // Limpiar
      if (coadmin) {
        await deleteCoadmin(coadmin.id)
      }
      if (telegramPatient) {
        await deletePatient(telegramPatient.id)
      }
    })
  })

  describe('getCoadminById', () => {
    it('should get coadmin by ID', async () => {
      expect(testCoadminId).not.toBeNull()
      
      const coadmin = await getCoadminById(testCoadminId!)
      
      expect(coadmin).not.toBeNull()
      expect(coadmin!.id).toBe(testCoadminId)
      expect(coadmin!.name).toBe('Test Coadmin')
    })

    it('should return null for non-existent ID', async () => {
      const coadmin = await getCoadminById('00000000-0000-0000-0000-000000000000')
      expect(coadmin).toBeNull()
    })
  })

  describe('getCoadminByPhone', () => {
    it('should get coadmin by phone', async () => {
      const coadmin = await getCoadminByPhone(testCoadminPhone)
      
      expect(coadmin).not.toBeNull()
      expect(coadmin!.phone).toBe(testCoadminPhone)
      expect(coadmin!.name).toBe('Test Coadmin')
    })

    it('should return null for non-existent phone', async () => {
      const coadmin = await getCoadminByPhone('+5700000000000')
      expect(coadmin).toBeNull()
    })
  })

  describe('getCoadminsByPatient', () => {
    it('should return array of coadmins for patient', async () => {
      expect(testPatientId).not.toBeNull()
      
      const coadmins = await getCoadminsByPatient(testPatientId!)
      
      expect(Array.isArray(coadmins)).toBe(true)
      expect(coadmins.length).toBeGreaterThan(0)
      
      // Verificar que el coadmin de prueba está en la lista
      const testCoadmin = coadmins.find(c => c.id === testCoadminId)
      expect(testCoadmin).toBeDefined()
    })

    it('should return empty array for patient without coadmins', async () => {
      const coadmins = await getCoadminsByPatient('00000000-0000-0000-0000-000000000000')
      expect(Array.isArray(coadmins)).toBe(true)
      expect(coadmins.length).toBe(0)
    })
  })

  describe('deleteCoadmin', () => {
    it('should delete coadmin', async () => {
      expect(testCoadminId).not.toBeNull()
      
      const result = await deleteCoadmin(testCoadminId!)
      expect(result).toBe(true)

      // Verificar que ya no existe
      const deleted = await getCoadminById(testCoadminId!)
      expect(deleted).toBeNull()

      testCoadminId = null // Ya no necesita limpieza
    })

    it('should return true for non-existent coadmin (idempotent)', async () => {
      const result = await deleteCoadmin('00000000-0000-0000-0000-000000000000')
      expect(result).toBe(true)
    })
  })

  describe('cleanup', () => {
    it('should delete the test patient', async () => {
      expect(testPatientId).not.toBeNull()
      
      const result = await deletePatient(testPatientId!)
      expect(result).toBe(true)

      testPatientId = null
    })
  })
})
