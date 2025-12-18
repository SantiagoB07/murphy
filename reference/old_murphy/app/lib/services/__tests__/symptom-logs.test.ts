/**
 * Tests de integración para el servicio de symptom-logs
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createPatient, deletePatient } from '../patients'
import {
  createSymptomLog,
  getSymptomLogById,
  getSymptomLogsByPatient,
  getSymptomLogByDateAndType,
  updateSymptomLog,
  deleteSymptomLog,
  deleteSymptomLogsByPatient,
} from '../symptom-logs'

describe('symptom-logs service', () => {
  let testPatientId: string
  let testLogId: string | null = null
  const today = new Date().toISOString().split('T')[0]

  beforeAll(async () => {
    const patient = await createPatient({
      name: 'Symptom Test Patient',
      phone: '+57SYMP' + Date.now(),
    })
    expect(patient).not.toBeNull()
    testPatientId = patient!.id
  })

  afterAll(async () => {
    // Limpiar symptoms antes de eliminar paciente (FK sin CASCADE)
    await deleteSymptomLogsByPatient(testPatientId)
    await deletePatient(testPatientId)
  })

  describe('createSymptomLog', () => {
    it('should create a new symptom log for stress', async () => {
      const log = await createSymptomLog({
        patient_id: testPatientId,
        symptom_type: 'stress',
        value: true,
        date: today,
        source: 'test',
      })

      expect(log).not.toBeNull()
      expect(log!.symptom_type).toBe('stress')
      expect(log!.value).toBe(true)
      expect(log!.date).toBe(today)
      expect(log!.patient_id).toBe(testPatientId)
      expect(log!.source).toBe('test')

      testLogId = log!.id
    })

    it('should create dizziness symptom with default source', async () => {
      const log = await createSymptomLog({
        patient_id: testPatientId,
        symptom_type: 'dizziness',
        value: false,
        date: today,
      })

      expect(log).not.toBeNull()
      expect(log!.symptom_type).toBe('dizziness')
      expect(log!.value).toBe(false)
      expect(log!.source).toBe('app')

      if (log) {
        await deleteSymptomLog(log.id)
      }
    })
  })

  describe('getSymptomLogById', () => {
    it('should get log by ID', async () => {
      expect(testLogId).not.toBeNull()
      
      const log = await getSymptomLogById(testLogId!)
      
      expect(log).not.toBeNull()
      expect(log!.id).toBe(testLogId)
      expect(log!.symptom_type).toBe('stress')
    })

    it('should return null for non-existent ID', async () => {
      const log = await getSymptomLogById('00000000-0000-0000-0000-000000000000')
      expect(log).toBeNull()
    })
  })

  describe('getSymptomLogByDateAndType', () => {
    it('should get log by patient, date, and type', async () => {
      const log = await getSymptomLogByDateAndType(testPatientId, today, 'stress')
      
      expect(log).not.toBeNull()
      expect(log!.date).toBe(today)
      expect(log!.symptom_type).toBe('stress')
      expect(log!.value).toBe(true)
    })

    it('should return null for non-existent combination', async () => {
      const log = await getSymptomLogByDateAndType(testPatientId, '2000-01-01', 'stress')
      expect(log).toBeNull()
    })
  })

  describe('getSymptomLogsByPatient', () => {
    it('should get logs for patient', async () => {
      const logs = await getSymptomLogsByPatient(testPatientId)
      
      expect(Array.isArray(logs)).toBe(true)
      expect(logs.length).toBeGreaterThan(0)
      expect(logs[0].patient_id).toBe(testPatientId)
    })

    it('should filter by symptomType', async () => {
      const logs = await getSymptomLogsByPatient(testPatientId, { symptomType: 'stress' })
      
      expect(Array.isArray(logs)).toBe(true)
      expect(logs.length).toBeGreaterThan(0)
      expect(logs.every(l => l.symptom_type === 'stress')).toBe(true)
    })

    it('should filter by daysBack', async () => {
      const logs = await getSymptomLogsByPatient(testPatientId, { daysBack: 1 })
      expect(Array.isArray(logs)).toBe(true)
    })

    it('should respect limit option', async () => {
      // Crear más logs
      for (let i = 1; i <= 3; i++) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        await createSymptomLog({
          patient_id: testPatientId,
          symptom_type: 'stress',
          value: i % 2 === 0,
          date: date.toISOString().split('T')[0],
        })
      }

      const logs = await getSymptomLogsByPatient(testPatientId, { limit: 2 })
      expect(logs.length).toBe(2)
    })
  })

  describe('updateSymptomLog', () => {
    it('should update symptom value', async () => {
      expect(testLogId).not.toBeNull()
      
      const updated = await updateSymptomLog(testLogId!, {
        value: false,
      })

      expect(updated).not.toBeNull()
      expect(updated!.value).toBe(false)
      expect(updated!.id).toBe(testLogId)
    })
  })

  describe('deleteSymptomLog', () => {
    it('should delete log', async () => {
      expect(testLogId).not.toBeNull()
      
      const result = await deleteSymptomLog(testLogId!)
      expect(result).toBe(true)

      const deleted = await getSymptomLogById(testLogId!)
      expect(deleted).toBeNull()

      testLogId = null
    })
  })
})
