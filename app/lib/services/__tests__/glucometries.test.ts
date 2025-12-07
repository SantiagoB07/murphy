/**
 * Tests de integración para el servicio de glucometries
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createPatient, deletePatient } from '../patients'
import {
  createGlucometry,
  getGlucometryById,
  getGlucometriesByPatient,
  updateGlucometry,
  deleteGlucometry,
} from '../glucometries'

describe('glucometries service', () => {
  let testPatientId: string
  let testGlucometryId: string | null = null

  beforeAll(async () => {
    // Crear paciente temporal para tests
    const patient = await createPatient({
      name: 'Glucometry Test Patient',
      phone: '+57GLUC' + Date.now(),
    })
    expect(patient).not.toBeNull()
    testPatientId = patient!.id
  })

  afterAll(async () => {
    // Limpiar paciente (cascade deletes glucometries)
    await deletePatient(testPatientId)
  })

  describe('createGlucometry', () => {
    it('should create a new glucometry', async () => {
      const now = new Date()
      const glucometry = await createGlucometry({
        patient_id: testPatientId,
        value: 120,
        scheduled_time: '07:00:00',
        measured_at: now.toISOString(),
        source: 'test',
      })

      expect(glucometry).not.toBeNull()
      expect(glucometry!.value).toBe(120)
      expect(glucometry!.patient_id).toBe(testPatientId)
      expect(glucometry!.scheduled_time).toBe('07:00:00')
      expect(glucometry!.source).toBe('test')

      testGlucometryId = glucometry!.id
    })

    it('should use default source if not provided', async () => {
      const now = new Date()
      const glucometry = await createGlucometry({
        patient_id: testPatientId,
        value: 130,
        scheduled_time: '12:00:00',
        measured_at: now.toISOString(),
      })

      expect(glucometry).not.toBeNull()
      expect(glucometry!.source).toBe('app')

      // Limpiar
      if (glucometry) {
        await deleteGlucometry(glucometry.id)
      }
    })
  })

  describe('getGlucometryById', () => {
    it('should get glucometry by ID', async () => {
      expect(testGlucometryId).not.toBeNull()
      
      const glucometry = await getGlucometryById(testGlucometryId!)
      
      expect(glucometry).not.toBeNull()
      expect(glucometry!.id).toBe(testGlucometryId)
      expect(glucometry!.value).toBe(120)
    })

    it('should return null for non-existent ID', async () => {
      const glucometry = await getGlucometryById('00000000-0000-0000-0000-000000000000')
      expect(glucometry).toBeNull()
    })
  })

  describe('getGlucometriesByPatient', () => {
    it('should get glucometries for patient', async () => {
      const glucometries = await getGlucometriesByPatient(testPatientId)
      
      expect(Array.isArray(glucometries)).toBe(true)
      expect(glucometries.length).toBeGreaterThan(0)
      expect(glucometries[0].patient_id).toBe(testPatientId)
    })

    it('should filter by daysBack', async () => {
      const glucometries = await getGlucometriesByPatient(testPatientId, { daysBack: 1 })
      
      expect(Array.isArray(glucometries)).toBe(true)
      // El glucometry creado hoy debe estar incluido
      expect(glucometries.length).toBeGreaterThan(0)
    })

    it('should respect limit option', async () => {
      // Crear más glucometries para probar limit
      const now = new Date()
      for (let i = 0; i < 3; i++) {
        await createGlucometry({
          patient_id: testPatientId,
          value: 100 + i,
          scheduled_time: '08:00:00',
          measured_at: now.toISOString(),
        })
      }

      const glucometries = await getGlucometriesByPatient(testPatientId, { limit: 2 })
      expect(glucometries.length).toBe(2)
    })
  })

  describe('updateGlucometry', () => {
    it('should update glucometry value', async () => {
      expect(testGlucometryId).not.toBeNull()
      
      const updated = await updateGlucometry(testGlucometryId!, {
        value: 150,
      })

      expect(updated).not.toBeNull()
      expect(updated!.value).toBe(150)
      expect(updated!.id).toBe(testGlucometryId)
    })
  })

  describe('deleteGlucometry', () => {
    it('should delete glucometry', async () => {
      expect(testGlucometryId).not.toBeNull()
      
      const result = await deleteGlucometry(testGlucometryId!)
      expect(result).toBe(true)

      // Verificar que ya no existe
      const deleted = await getGlucometryById(testGlucometryId!)
      expect(deleted).toBeNull()

      testGlucometryId = null
    })
  })
})
