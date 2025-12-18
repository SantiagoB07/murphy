/**
 * Tests de integración para el servicio de insulin-doses
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createPatient, deletePatient } from '../patients'
import {
  createInsulinDose,
  getInsulinDoseById,
  getInsulinDosesByPatient,
  updateInsulinDose,
  deleteInsulinDose,
} from '../insulin-doses'

describe('insulin-doses service', () => {
  let testPatientId: string
  let testDoseId: string | null = null

  beforeAll(async () => {
    const patient = await createPatient({
      name: 'Insulin Test Patient',
      phone: '+57INS' + Date.now(),
    })
    expect(patient).not.toBeNull()
    testPatientId = patient!.id
  })

  afterAll(async () => {
    await deletePatient(testPatientId)
  })

  describe('createInsulinDose', () => {
    it('should create a new insulin dose', async () => {
      const now = new Date()
      const dose = await createInsulinDose({
        patient_id: testPatientId,
        dose: 10,
        unit: 'units',
        scheduled_time: '07:30:00',
        administered_at: now.toISOString(),
        source: 'test',
      })

      expect(dose).not.toBeNull()
      expect(dose!.dose).toBe(10)
      expect(dose!.unit).toBe('units')
      expect(dose!.patient_id).toBe(testPatientId)
      expect(dose!.source).toBe('test')

      testDoseId = dose!.id
    })

    it('should use default unit and source if not provided', async () => {
      const now = new Date()
      const dose = await createInsulinDose({
        patient_id: testPatientId,
        dose: 12,
        scheduled_time: '22:00:00',
        administered_at: now.toISOString(),
      })

      expect(dose).not.toBeNull()
      expect(dose!.unit).toBe('units')
      expect(dose!.source).toBe('app')

      if (dose) {
        await deleteInsulinDose(dose.id)
      }
    })
  })

  describe('getInsulinDoseById', () => {
    it('should get dose by ID', async () => {
      expect(testDoseId).not.toBeNull()
      
      const dose = await getInsulinDoseById(testDoseId!)
      
      expect(dose).not.toBeNull()
      expect(dose!.id).toBe(testDoseId)
      expect(dose!.dose).toBe(10)
    })

    it('should return null for non-existent ID', async () => {
      const dose = await getInsulinDoseById('00000000-0000-0000-0000-000000000000')
      expect(dose).toBeNull()
    })
  })

  describe('getInsulinDosesByPatient', () => {
    it('should get doses for patient', async () => {
      const doses = await getInsulinDosesByPatient(testPatientId)
      
      expect(Array.isArray(doses)).toBe(true)
      expect(doses.length).toBeGreaterThan(0)
      expect(doses[0].patient_id).toBe(testPatientId)
    })

    it('should filter by daysBack', async () => {
      const doses = await getInsulinDosesByPatient(testPatientId, { daysBack: 1 })
      expect(Array.isArray(doses)).toBe(true)
      expect(doses.length).toBeGreaterThan(0)
    })

    it('should respect limit option', async () => {
      const now = new Date()
      for (let i = 0; i < 3; i++) {
        await createInsulinDose({
          patient_id: testPatientId,
          dose: 8 + i,
          scheduled_time: '08:00:00',
          administered_at: now.toISOString(),
        })
      }

      const doses = await getInsulinDosesByPatient(testPatientId, { limit: 2 })
      expect(doses.length).toBe(2)
    })
  })

  describe('updateInsulinDose', () => {
    it('should update dose value', async () => {
      expect(testDoseId).not.toBeNull()
      
      const updated = await updateInsulinDose(testDoseId!, {
        dose: 15,
      })

      expect(updated).not.toBeNull()
      expect(updated!.dose).toBe(15)
      expect(updated!.id).toBe(testDoseId)
    })
  })

  describe('deleteInsulinDose', () => {
    it('should delete dose', async () => {
      expect(testDoseId).not.toBeNull()
      
      const result = await deleteInsulinDose(testDoseId!)
      expect(result).toBe(true)

      const deleted = await getInsulinDoseById(testDoseId!)
      expect(deleted).toBeNull()

      testDoseId = null
    })
  })
})
