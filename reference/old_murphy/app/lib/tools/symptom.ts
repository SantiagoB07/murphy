import { tool } from 'ai'
import { z } from 'zod'
import { supabase } from '../supabase'

type Source = 'whatsapp' | 'call'

const VALID_SYMPTOMS = ['stress', 'dizziness'] as const
export type SymptomType = typeof VALID_SYMPTOMS[number]

const symptomNames: Record<SymptomType, string> = {
  stress: 'estrés/ansiedad',
  dizziness: 'mareos',
}

// ============================================
// Standalone functions (reusable)
// ============================================

export async function saveSymptom(
  patientId: string,
  symptomType: SymptomType,
  value: boolean,
  source: Source = 'whatsapp',
  awaitResponse: boolean = true
) {
  console.log(`[TOOL] saveSymptom llamada con symptom_type: ${symptomType}, value: ${value}, source: ${source}`)
  
  const record = {
    patient_id: patientId,
    symptom_type: symptomType,
    value,
    date: new Date().toISOString().split('T')[0],
    source,
  }
  
  const symptomName = symptomNames[symptomType]
  const valueText = value ? 'sí' : 'no'
  
  if (awaitResponse) {
    const { error } = await supabase.from('symptom_logs').insert(record)
    if (error) {
      console.error('[TOOL] Error guardando síntoma:', error)
      return { success: false, message: 'Error al guardar el síntoma' }
    }
    console.log(`[TOOL] Síntoma guardado: ${symptomName} = ${valueText}`)
  } else {
    supabase.from('symptom_logs').insert(record).then(({ error }) => {
      if (error) {
        console.error('[TOOL] Error guardando síntoma:', error)
      } else {
        console.log(`[TOOL] Síntoma guardado: ${symptomName} = ${valueText}`)
      }
    })
  }
  
  return { success: true, message: `Registrado: ${symptomName} = ${valueText}` }
}

export async function updateSymptom(
  patientId: string,
  symptomType: SymptomType,
  value: boolean,
  awaitResponse: boolean = true
) {
  console.log(`[TOOL] updateSymptom llamada con symptom_type: ${symptomType}, value: ${value}`)
  
  const symptomName = symptomNames[symptomType]
  
  const { data: latest, error: findError } = await supabase
    .from('symptom_logs')
    .select('id, value')
    .eq('patient_id', patientId)
    .eq('symptom_type', symptomType)
    .order('date', { ascending: false })
    .limit(1)
    .single()
  
  if (findError || !latest) {
    console.error(`[TOOL] No hay registros de ${symptomName} para actualizar`)
    return { success: false, message: `No hay registros de ${symptomName} para actualizar` }
  }
  
  const oldValue = latest.value
  const oldText = oldValue ? 'sí' : 'no'
  const newText = value ? 'sí' : 'no'
  
  if (awaitResponse) {
    const { error: updateError } = await supabase
      .from('symptom_logs')
      .update({ value })
      .eq('id', latest.id)
    
    if (updateError) {
      console.error('[TOOL] Error actualizando síntoma:', updateError)
      return { success: false, message: 'Error al actualizar el síntoma' }
    }
    console.log(`[TOOL] Síntoma actualizado: ${symptomName} ${oldText} -> ${newText}`)
  } else {
    supabase
      .from('symptom_logs')
      .update({ value })
      .eq('id', latest.id)
      .then(({ error }) => {
        if (error) {
          console.error('[TOOL] Error actualizando síntoma:', error)
        } else {
          console.log(`[TOOL] Síntoma actualizado: ${symptomName} ${oldText} -> ${newText}`)
        }
      })
  }
  
  return { success: true, message: `${symptomName} actualizado de ${oldText} a ${newText}` }
}

// Helper para validar symptom type
export function isValidSymptomType(value: string): value is SymptomType {
  return VALID_SYMPTOMS.includes(value as SymptomType)
}

// ============================================
// AI SDK Tool wrappers
// ============================================

export function createSymptomTools(patientId: string) {
  return {
    save_symptom: tool({
      description: 'Registra un síntoma del paciente. Usa cuando el usuario mencione que tiene estrés/ansiedad o mareos.',
      inputSchema: z.object({
        symptom_type: z.enum(VALID_SYMPTOMS).describe('Tipo de síntoma: "stress" para estrés/ansiedad, "dizziness" para mareos'),
        value: z.boolean().describe('true si tiene el síntoma, false si no'),
      }),
      execute: async ({ symptom_type, value }) => saveSymptom(patientId, symptom_type, value, 'whatsapp', true),
    }),

    update_symptom: tool({
      description: 'Actualiza/corrige el último registro de un síntoma. Usa cuando el usuario quiera corregir un síntoma.',
      inputSchema: z.object({
        symptom_type: z.enum(VALID_SYMPTOMS).describe('Tipo de síntoma: "stress" para estrés/ansiedad, "dizziness" para mareos'),
        value: z.boolean().describe('Nuevo valor: true si tiene el síntoma, false si no'),
      }),
      execute: async ({ symptom_type, value }) => updateSymptom(patientId, symptom_type, value, true),
    }),
  }
}
