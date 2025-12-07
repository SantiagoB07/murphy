/**
 * Tests de integración para el servicio de patients
 * 
 * Estos tests usan la base de datos real de Supabase
 * Cada test crea y elimina su propio paciente de prueba
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
  createPatient,
  deletePatient,
  getPatientById,
  getPatientByPhone,
  getAllPatients,
  getFirstPatient,
} from '../patients'

describe('patients service', () => {
  // Paciente temporal para tests
  let testPatientId: string | null = null
  const testPhone = '+57TEST' + Date.now() // Número único para evitar colisiones

  afterAll(async () => {
    // Limpiar paciente de prueba si quedó
    if (testPatientId) {
      await deletePatient(testPatientId)
    }
  })

  describe('createPatient', () => {
    it('should create a new patient', async () => {
      const patient = await createPatient({
        name: 'Test Patient',
        phone: testPhone,
        age: 30,
        diabetes_type: 'Tipo 1',
        diagnosis_year: 2020,
      })

      expect(patient).not.toBeNull()
      expect(patient!.name).toBe('Test Patient')
      expect(patient!.phone).toBe(testPhone)
      expect(patient!.age).toBe(30)
      expect(patient!.diabetes_type).toBe('Tipo 1')
      expect(patient!.diagnosis_year).toBe(2020)
      expect(patient!.id).toBeDefined()

      testPatientId = patient!.id
    })

    it('should create patient with minimal data', async () => {
      const minimalPhone = '+57MINIMAL' + Date.now()
      const patient = await createPatient({
        name: 'Minimal Patient',
        phone: minimalPhone,
      })

      expect(patient).not.toBeNull()
      expect(patient!.name).toBe('Minimal Patient')
      expect(patient!.age).toBeNull()
      expect(patient!.diabetes_type).toBeNull()

      // Limpiar
      if (patient) {
        await deletePatient(patient.id)
      }
    })
  })

  describe('getPatientById', () => {
    it('should get patient by ID', async () => {
      expect(testPatientId).not.toBeNull()
      
      const patient = await getPatientById(testPatientId!)
      
      expect(patient).not.toBeNull()
      expect(patient!.id).toBe(testPatientId)
      expect(patient!.name).toBe('Test Patient')
    })

    it('should return null for non-existent ID', async () => {
      const patient = await getPatientById('00000000-0000-0000-0000-000000000000')
      expect(patient).toBeNull()
    })
  })

  describe('getPatientByPhone', () => {
    it('should get patient by phone', async () => {
      const patient = await getPatientByPhone(testPhone)
      
      expect(patient).not.toBeNull()
      expect(patient!.phone).toBe(testPhone)
      expect(patient!.name).toBe('Test Patient')
    })

    it('should return null for non-existent phone', async () => {
      const patient = await getPatientByPhone('+5700000000000')
      expect(patient).toBeNull()
    })
  })

  describe('getAllPatients', () => {
    it('should return array of patients', async () => {
      const patients = await getAllPatients()
      
      expect(Array.isArray(patients)).toBe(true)
      expect(patients.length).toBeGreaterThan(0)
      
      // Verificar que el paciente de prueba está en la lista
      const testPatient = patients.find(p => p.id === testPatientId)
      expect(testPatient).toBeDefined()
    })
  })

  describe('getFirstPatient', () => {
    it('should return first patient', async () => {
      const patient = await getFirstPatient()
      
      expect(patient).not.toBeNull()
      expect(patient!.id).toBeDefined()
      expect(patient!.name).toBeDefined()
    })
  })

  describe('deletePatient', () => {
    it('should delete patient', async () => {
      expect(testPatientId).not.toBeNull()
      
      const result = await deletePatient(testPatientId!)
      expect(result).toBe(true)

      // Verificar que ya no existe
      const deleted = await getPatientById(testPatientId!)
      expect(deleted).toBeNull()

      testPatientId = null // Ya no necesita limpieza
    })

    it('should return true for non-existent patient (idempotent)', async () => {
      const result = await deletePatient('00000000-0000-0000-0000-000000000000')
      expect(result).toBe(true)
    })
  })
})
