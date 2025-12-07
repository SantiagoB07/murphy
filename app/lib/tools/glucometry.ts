import { tool } from 'ai'
import { z } from 'zod'
import { supabase } from '../supabase'

type Source = 'whatsapp' | 'call'

// ============================================
// Standalone functions (reusable)
// ============================================

export async function saveGlucometry(
  patientId: string,
  value: number,
  source: Source = 'whatsapp',
  awaitResponse: boolean = true
) {
  console.log(`[TOOL] saveGlucometry llamada con value: ${value}, source: ${source}`)
  
  const now = new Date()
  const record = {
    patient_id: patientId,
    value,
    scheduled_time: now.toTimeString().split(' ')[0],
    measured_at: now.toISOString(),
    source,
  }
  
  if (awaitResponse) {
    const { error } = await supabase.from('glucometries').insert(record)
    if (error) {
      console.error('[TOOL] Error guardando glucometría:', error)
      return { success: false, message: 'Error al guardar la glucosa' }
    }
    console.log(`[TOOL] Glucometría guardada: ${value} mg/dL`)
  } else {
    // Fire-and-forget para llamadas (respuesta inmediata)
    supabase.from('glucometries').insert(record).then(({ error }) => {
      if (error) {
        console.error('[TOOL] Error guardando glucometría:', error)
      } else {
        console.log(`[TOOL] Glucometría guardada: ${value} mg/dL`)
      }
    })
  }
  
  return { success: true, message: `Glucosa de ${value} mg/dL registrada correctamente` }
}

export async function updateGlucometry(
  patientId: string,
  value: number,
  awaitResponse: boolean = true
) {
  console.log(`[TOOL] updateGlucometry llamada con value: ${value}`)
  
  // Buscar el último registro (siempre await para obtener el ID)
  const { data: latest, error: findError } = await supabase
    .from('glucometries')
    .select('id, value')
    .eq('patient_id', patientId)
    .order('measured_at', { ascending: false })
    .limit(1)
    .single()
  
  if (findError || !latest) {
    console.error('[TOOL] No hay registros de glucosa para actualizar')
    return { success: false, message: 'No hay registros de glucosa para actualizar' }
  }
  
  const oldValue = latest.value
  
  if (awaitResponse) {
    const { error: updateError } = await supabase
      .from('glucometries')
      .update({ value })
      .eq('id', latest.id)
    
    if (updateError) {
      console.error('[TOOL] Error actualizando glucometría:', updateError)
      return { success: false, message: 'Error al actualizar la glucosa' }
    }
    console.log(`[TOOL] Glucometría actualizada: ${oldValue} -> ${value} mg/dL`)
  } else {
    supabase
      .from('glucometries')
      .update({ value })
      .eq('id', latest.id)
      .then(({ error }) => {
        if (error) {
          console.error('[TOOL] Error actualizando glucometría:', error)
        } else {
          console.log(`[TOOL] Glucometría actualizada: ${oldValue} -> ${value} mg/dL`)
        }
      })
  }
  
  return { success: true, message: `Glucosa actualizada de ${oldValue} a ${value} mg/dL` }
}

// ============================================
// AI SDK Tool wrappers
// ============================================

export function createGlucometryTools(patientId: string) {
  return {
    save_glucometry: tool({
      description: 'Registra el valor de glucosa/glucometría del paciente. Usa esta herramienta cuando el usuario mencione su nivel de glucosa o azúcar.',
      inputSchema: z.object({
        value: z.number().describe('Valor de glucosa en mg/dL'),
      }),
      execute: async ({ value }) => saveGlucometry(patientId, value, 'whatsapp', true),
    }),

    update_glucometry: tool({
      description: 'Actualiza/corrige el último registro de glucosa del paciente. Usa cuando el usuario quiera corregir un valor de glucosa.',
      inputSchema: z.object({
        value: z.number().describe('Nuevo valor de glucosa en mg/dL'),
      }),
      execute: async ({ value }) => updateGlucometry(patientId, value, true),
    }),
  }
}
