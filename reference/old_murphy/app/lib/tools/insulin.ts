import { tool } from 'ai'
import { z } from 'zod'
import { supabase } from '../supabase'

type Source = 'whatsapp' | 'call'

// ============================================
// Standalone functions (reusable)
// ============================================

export async function saveInsulin(
  patientId: string,
  dose: number,
  source: Source = 'whatsapp',
  awaitResponse: boolean = true
) {
  console.log(`[TOOL] saveInsulin llamada con dose: ${dose}, source: ${source}`)
  
  const now = new Date()
  const record = {
    patient_id: patientId,
    dose,
    unit: 'units',
    scheduled_time: now.toTimeString().split(' ')[0],
    administered_at: now.toISOString(),
    source,
  }
  
  if (awaitResponse) {
    const { error } = await supabase.from('insulin_doses').insert(record)
    if (error) {
      console.error('[TOOL] Error guardando insulina:', error)
      return { success: false, message: 'Error al guardar la dosis de insulina' }
    }
    console.log(`[TOOL] Insulina guardada: ${dose} unidades`)
  } else {
    supabase.from('insulin_doses').insert(record).then(({ error }) => {
      if (error) {
        console.error('[TOOL] Error guardando insulina:', error)
      } else {
        console.log(`[TOOL] Insulina guardada: ${dose} unidades`)
      }
    })
  }
  
  return { success: true, message: `Dosis de ${dose} unidades de insulina registrada` }
}

export async function updateInsulin(
  patientId: string,
  dose: number,
  awaitResponse: boolean = true
) {
  console.log(`[TOOL] updateInsulin llamada con dose: ${dose}`)
  
  const { data: latest, error: findError } = await supabase
    .from('insulin_doses')
    .select('id, dose, unit')
    .eq('patient_id', patientId)
    .order('administered_at', { ascending: false })
    .limit(1)
    .single()
  
  if (findError || !latest) {
    console.error('[TOOL] No hay registros de insulina para actualizar')
    return { success: false, message: 'No hay registros de insulina para actualizar' }
  }
  
  const oldDose = latest.dose
  
  if (awaitResponse) {
    const { error: updateError } = await supabase
      .from('insulin_doses')
      .update({ dose })
      .eq('id', latest.id)
    
    if (updateError) {
      console.error('[TOOL] Error actualizando insulina:', updateError)
      return { success: false, message: 'Error al actualizar la dosis de insulina' }
    }
    console.log(`[TOOL] Insulina actualizada: ${oldDose} -> ${dose} unidades`)
  } else {
    supabase
      .from('insulin_doses')
      .update({ dose })
      .eq('id', latest.id)
      .then(({ error }) => {
        if (error) {
          console.error('[TOOL] Error actualizando insulina:', error)
        } else {
          console.log(`[TOOL] Insulina actualizada: ${oldDose} -> ${dose} unidades`)
        }
      })
  }
  
  return { success: true, message: `Insulina actualizada de ${oldDose} a ${dose} unidades` }
}

// ============================================
// AI SDK Tool wrappers
// ============================================

export function createInsulinTools(patientId: string) {
  return {
    save_insulin: tool({
      description: 'Registra una dosis de insulina del paciente. Usa cuando el usuario mencione que se aplicó insulina.',
      inputSchema: z.object({
        dose: z.number().describe('Cantidad de unidades de insulina'),
      }),
      execute: async ({ dose }) => saveInsulin(patientId, dose, 'whatsapp', true),
    }),

    update_insulin: tool({
      description: 'Actualiza/corrige la última dosis de insulina del paciente. Usa cuando el usuario quiera corregir una dosis.',
      inputSchema: z.object({
        dose: z.number().describe('Nueva cantidad de unidades de insulina'),
      }),
      execute: async ({ dose }) => updateInsulin(patientId, dose, true),
    }),
  }
}
