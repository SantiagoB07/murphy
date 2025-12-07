import { tool } from 'ai'
import { z } from 'zod'
import { supabase } from '../supabase'

const VALID_SYMPTOMS = ['stress', 'dizziness'] as const
type SymptomType = typeof VALID_SYMPTOMS[number]

const symptomNames: Record<SymptomType, string> = {
  stress: 'estrés/ansiedad',
  dizziness: 'mareos',
}

export function createSymptomTools(patientId: string) {
  return {
    save_symptom: tool({
      description: 'Registra un síntoma del paciente. Usa cuando el usuario mencione que tiene estrés/ansiedad o mareos.',
      inputSchema: z.object({
        symptom_type: z.enum(VALID_SYMPTOMS).describe('Tipo de síntoma: "stress" para estrés/ansiedad, "dizziness" para mareos'),
        value: z.boolean().describe('true si tiene el síntoma, false si no'),
      }),
      execute: async ({ symptom_type, value }) => {
        console.log(`[TOOL] save_symptom llamada con symptom_type: ${symptom_type}, value: ${value}`)
        
        const { error } = await supabase.from('symptom_logs').insert({
          patient_id: patientId,
          symptom_type,
          value,
          date: new Date().toISOString().split('T')[0],
          source: 'whatsapp',
        })
        
        if (error) {
          console.error('[TOOL] Error guardando síntoma:', error)
          return { success: false, message: 'Error al guardar el síntoma' }
        }
        
        const symptomName = symptomNames[symptom_type]
        const valueText = value ? 'sí' : 'no'
        
        console.log(`[TOOL] Síntoma guardado: ${symptomName} = ${valueText}`)
        return { success: true, message: `Registrado: ${symptomName} = ${valueText}` }
      },
    }),

    update_symptom: tool({
      description: 'Actualiza/corrige el último registro de un síntoma. Usa cuando el usuario quiera corregir un síntoma.',
      inputSchema: z.object({
        symptom_type: z.enum(VALID_SYMPTOMS).describe('Tipo de síntoma: "stress" para estrés/ansiedad, "dizziness" para mareos'),
        value: z.boolean().describe('Nuevo valor: true si tiene el síntoma, false si no'),
      }),
      execute: async ({ symptom_type, value }) => {
        console.log(`[TOOL] update_symptom llamada con symptom_type: ${symptom_type}, value: ${value}`)
        
        const { data: latest, error: findError } = await supabase
          .from('symptom_logs')
          .select('id, value')
          .eq('patient_id', patientId)
          .eq('symptom_type', symptom_type)
          .order('date', { ascending: false })
          .limit(1)
          .single()
        
        if (findError || !latest) {
          const symptomName = symptomNames[symptom_type]
          console.error(`[TOOL] No hay registros de ${symptomName} para actualizar`)
          return { success: false, message: `No hay registros de ${symptomName} para actualizar` }
        }
        
        const oldValue = latest.value
        
        const { error: updateError } = await supabase
          .from('symptom_logs')
          .update({ value })
          .eq('id', latest.id)
        
        if (updateError) {
          console.error('[TOOL] Error actualizando síntoma:', updateError)
          return { success: false, message: 'Error al actualizar el síntoma' }
        }
        
        const symptomName = symptomNames[symptom_type]
        const oldText = oldValue ? 'sí' : 'no'
        const newText = value ? 'sí' : 'no'
        
        console.log(`[TOOL] Síntoma actualizado: ${symptomName} ${oldText} -> ${newText}`)
        return { success: true, message: `${symptomName} actualizado de ${oldText} a ${newText}` }
      },
    }),
  }
}
