/**
 * Tests de integración para el servicio de treatment-schedule
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createPatient, deletePatient } from '../patients'
import {
  createTreatmentSlot,
  getTreatmentSlotById,
  getTreatmentSlotsByPatient,
  getGlucoseSlotsByPatient,
  getInsulinSlotsByPatient,
  updateTreatmentSlot,
  toggleTreatmentSlot,
  deleteTreatmentSlot,
} from '../treatment-schedule'

describe('treatment-schedule service', () => {
  let testPatientId: string
  let testGlucoseSlotId: string | null = null
  let testInsulinSlotId: string | null = null

  beforeAll(async () => {
    const patient = await createPatient({
      name: 'Treatment Test Patient',
      phone: '+57TREAT' + Date.now(),
    })
    expect(patient).not.toBeNull()
    testPatientId = patient!.id
  })

  afterAll(async () => {
    await deletePatient(testPatientId)
  })

  describe('createTreatmentSlot', () => {
    it('should create a glucose slot', async () => {
      const slot = await createTreatmentSlot({
        patient_id: testPatientId,
        type: 'glucose',
        scheduled_time: '07:00:00',
        label: 'Antes del desayuno',
      })

      expect(slot).not.toBeNull()
      expect(slot!.type).toBe('glucose')
      expect(slot!.scheduled_time).toBe('07:00:00')
      expect(slot!.label).toBe('Antes del desayuno')
      expect(slot!.enabled).toBe(true)
      expect(slot!.expected_dose).toBeNull()
      expect(slot!.insulin_type).toBeNull()

      testGlucoseSlotId = slot!.id
    })

    it('should create an insulin slot with dose', async () => {
      const slot = await createTreatmentSlot({
        patient_id: testPatientId,
        type: 'insulin',
        scheduled_time: '07:30:00',
        label: 'Desayuno',
        expected_dose: 10,
        insulin_type: 'rapid',
      })

      expect(slot).not.toBeNull()
      expect(slot!.type).toBe('insulin')
      expect(slot!.expected_dose).toBe(10)
      expect(slot!.insulin_type).toBe('rapid')
      expect(slot!.enabled).toBe(true)

      testInsulinSlotId = slot!.id
    })

    it('should create disabled slot', async () => {
      const slot = await createTreatmentSlot({
        patient_id: testPatientId,
        type: 'glucose',
        scheduled_time: '15:00:00',
        label: 'Extra',
        enabled: false,
      })

      expect(slot).not.toBeNull()
      expect(slot!.enabled).toBe(false)

      if (slot) {
        await deleteTreatmentSlot(slot.id)
      }
    })
  })

  describe('getTreatmentSlotById', () => {
    it('should get slot by ID', async () => {
      expect(testGlucoseSlotId).not.toBeNull()
      
      const slot = await getTreatmentSlotById(testGlucoseSlotId!)
      
      expect(slot).not.toBeNull()
      expect(slot!.id).toBe(testGlucoseSlotId)
      expect(slot!.type).toBe('glucose')
    })

    it('should return null for non-existent ID', async () => {
      const slot = await getTreatmentSlotById('00000000-0000-0000-0000-000000000000')
      expect(slot).toBeNull()
    })
  })

  describe('getTreatmentSlotsByPatient', () => {
    it('should get all slots for patient', async () => {
      const slots = await getTreatmentSlotsByPatient(testPatientId)
      
      expect(Array.isArray(slots)).toBe(true)
      expect(slots.length).toBeGreaterThanOrEqual(2)
      expect(slots[0].patient_id).toBe(testPatientId)
    })

    it('should filter by type', async () => {
      const slots = await getTreatmentSlotsByPatient(testPatientId, { type: 'glucose' })
      
      expect(Array.isArray(slots)).toBe(true)
      expect(slots.every(s => s.type === 'glucose')).toBe(true)
    })

    it('should filter by enabled', async () => {
      const slots = await getTreatmentSlotsByPatient(testPatientId, { enabledOnly: true })
      
      expect(Array.isArray(slots)).toBe(true)
      expect(slots.every(s => s.enabled === true)).toBe(true)
    })
  })

  describe('getGlucoseSlotsByPatient', () => {
    it('should get only glucose slots', async () => {
      const slots = await getGlucoseSlotsByPatient(testPatientId)
      
      expect(Array.isArray(slots)).toBe(true)
      expect(slots.length).toBeGreaterThan(0)
      expect(slots.every(s => s.type === 'glucose')).toBe(true)
    })
  })

  describe('getInsulinSlotsByPatient', () => {
    it('should get only insulin slots', async () => {
      const slots = await getInsulinSlotsByPatient(testPatientId)
      
      expect(Array.isArray(slots)).toBe(true)
      expect(slots.length).toBeGreaterThan(0)
      expect(slots.every(s => s.type === 'insulin')).toBe(true)
    })
  })

  describe('updateTreatmentSlot', () => {
    it('should update slot label', async () => {
      expect(testGlucoseSlotId).not.toBeNull()
      
      const updated = await updateTreatmentSlot(testGlucoseSlotId!, {
        label: 'Ayunas',
      })

      expect(updated).not.toBeNull()
      expect(updated!.label).toBe('Ayunas')
      expect(updated!.id).toBe(testGlucoseSlotId)
    })

    it('should update insulin dose', async () => {
      expect(testInsulinSlotId).not.toBeNull()
      
      const updated = await updateTreatmentSlot(testInsulinSlotId!, {
        expected_dose: 12,
      })

      expect(updated).not.toBeNull()
      expect(updated!.expected_dose).toBe(12)
    })
  })

  describe('toggleTreatmentSlot', () => {
    it('should disable slot', async () => {
      expect(testGlucoseSlotId).not.toBeNull()
      
      const result = await toggleTreatmentSlot(testGlucoseSlotId!, false)
      expect(result).toBe(true)

      const slot = await getTreatmentSlotById(testGlucoseSlotId!)
      expect(slot!.enabled).toBe(false)
    })

    it('should enable slot', async () => {
      expect(testGlucoseSlotId).not.toBeNull()
      
      const result = await toggleTreatmentSlot(testGlucoseSlotId!, true)
      expect(result).toBe(true)

      const slot = await getTreatmentSlotById(testGlucoseSlotId!)
      expect(slot!.enabled).toBe(true)
    })
  })

  describe('deleteTreatmentSlot', () => {
    it('should delete glucose slot', async () => {
      expect(testGlucoseSlotId).not.toBeNull()
      
      const result = await deleteTreatmentSlot(testGlucoseSlotId!)
      expect(result).toBe(true)

      const deleted = await getTreatmentSlotById(testGlucoseSlotId!)
      expect(deleted).toBeNull()

      testGlucoseSlotId = null
    })

    it('should delete insulin slot', async () => {
      expect(testInsulinSlotId).not.toBeNull()
      
      const result = await deleteTreatmentSlot(testInsulinSlotId!)
      expect(result).toBe(true)

      const deleted = await getTreatmentSlotById(testInsulinSlotId!)
      expect(deleted).toBeNull()

      testInsulinSlotId = null
    })
  })
})
