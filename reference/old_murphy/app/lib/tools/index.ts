import { createGlucometryTools } from './glucometry'
import { createInsulinTools } from './insulin'
import { createSleepTools } from './sleep'
import { createSymptomTools } from './symptom'

export function createMurphyTools(patientId: string) {
  return {
    ...createGlucometryTools(patientId),
    ...createInsulinTools(patientId),
    ...createSleepTools(patientId),
    ...createSymptomTools(patientId),
  }
}
