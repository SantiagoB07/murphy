/**
 * Tests de integración para el servicio de sleep-logs
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createPatient, deletePatient } from '../patients'
import {
  createSleepLog,
  getSleepLogById,
  getSleepLogsByPatient,
  getSleepLogByDate,
  updateSleepLog,
  deleteSleepLog,
} from '../sleep-logs'

describe('sleep-logs service', () => {
  let testPatientId: string
  let testLogId: string | null = null
  const today = new Date().toISOString().split('T')[0]

  beforeAll(async () => {
    const patient = await createPatient({
      name: 'Sleep Test Patient',
      phone: '+57SLEEP' + Date.now(),
    })
    expect(patient).not.toBeNull()
    testPatientId = patient!.id
  })

  afterAll(async () => {
    await deletePatient(testPatientId)
  })

  describe('createSleepLog', () => {
    it('should create a new sleep log', async () => {
      const log = await createSleepLog({
        patient_id: testPatientId,
        hours: 7.5,
        date: today,
        source: 'test',
      })

      expect(log).not.toBeNull()
      expect(log!.hours).toBe(7.5)
      expect(log!.date).toBe(today)
      expect(log!.patient_id).toBe(testPatientId)
      expect(log!.source).toBe('test')

      testLogId = log!.id
    })

    it('should use default source if not provided', async () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]

      const log = await createSleepLog({
        patient_id: testPatientId,
        hours: 6.0,
        date: yesterdayStr,
      })

      expect(log).not.toBeNull()
      expect(log!.source).toBe('app')

      if (log) {
        await deleteSleepLog(log.id)
      }
    })
  })

  describe('getSleepLogById', () => {
    it('should get log by ID', async () => {
      expect(testLogId).not.toBeNull()
      
      const log = await getSleepLogById(testLogId!)
      
      expect(log).not.toBeNull()
      expect(log!.id).toBe(testLogId)
      expect(log!.hours).toBe(7.5)
    })

    it('should return null for non-existent ID', async () => {
      const log = await getSleepLogById('00000000-0000-0000-0000-000000000000')
      expect(log).toBeNull()
    })
  })

  describe('getSleepLogByDate', () => {
    it('should get log by patient and date', async () => {
      const log = await getSleepLogByDate(testPatientId, today)
      
      expect(log).not.toBeNull()
      expect(log!.date).toBe(today)
      expect(log!.hours).toBe(7.5)
    })

    it('should return null for non-existent date', async () => {
      const log = await getSleepLogByDate(testPatientId, '2000-01-01')
      expect(log).toBeNull()
    })
  })

  describe('getSleepLogsByPatient', () => {
    it('should get logs for patient', async () => {
      const logs = await getSleepLogsByPatient(testPatientId)
      
      expect(Array.isArray(logs)).toBe(true)
      expect(logs.length).toBeGreaterThan(0)
      expect(logs[0].patient_id).toBe(testPatientId)
    })

    it('should filter by daysBack', async () => {
      const logs = await getSleepLogsByPatient(testPatientId, { daysBack: 1 })
      expect(Array.isArray(logs)).toBe(true)
      expect(logs.length).toBeGreaterThan(0)
    })

    it('should respect limit option', async () => {
      // Crear más logs
      for (let i = 2; i <= 4; i++) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        await createSleepLog({
          patient_id: testPatientId,
          hours: 6 + i * 0.5,
          date: date.toISOString().split('T')[0],
        })
      }

      const logs = await getSleepLogsByPatient(testPatientId, { limit: 2 })
      expect(logs.length).toBe(2)
    })
  })

  describe('updateSleepLog', () => {
    it('should update sleep hours', async () => {
      expect(testLogId).not.toBeNull()
      
      const updated = await updateSleepLog(testLogId!, {
        hours: 8.0,
      })

      expect(updated).not.toBeNull()
      expect(updated!.hours).toBe(8.0)
      expect(updated!.id).toBe(testLogId)
    })
  })

  describe('deleteSleepLog', () => {
    it('should delete log', async () => {
      expect(testLogId).not.toBeNull()
      
      const result = await deleteSleepLog(testLogId!)
      expect(result).toBe(true)

      const deleted = await getSleepLogById(testLogId!)
      expect(deleted).toBeNull()

      testLogId = null
    })
  })
})
