import { tool } from 'ai'
import { z } from 'zod'
import { supabase } from '../supabase'

type Source = 'whatsapp' | 'call'

// ============================================
// Standalone functions (reusable)
// ============================================

export async function saveSleep(
  patientId: string,
  hours: number,
  source: Source = 'whatsapp',
  awaitResponse: boolean = true
) {
  console.log(`[TOOL] saveSleep llamada con hours: ${hours}, source: ${source}`)
  
  const record = {
    patient_id: patientId,
    hours,
    date: new Date().toISOString().split('T')[0],
    source,
  }
  
  if (awaitResponse) {
    const { error } = await supabase.from('sleep_logs').insert(record)
    if (error) {
      console.error('[TOOL] Error guardando sueño:', error)
      return { success: false, message: 'Error al guardar las horas de sueño' }
    }
    console.log(`[TOOL] Sueño guardado: ${hours} horas`)
  } else {
    supabase.from('sleep_logs').insert(record).then(({ error }) => {
      if (error) {
        console.error('[TOOL] Error guardando sueño:', error)
      } else {
        console.log(`[TOOL] Sueño guardado: ${hours} horas`)
      }
    })
  }
  
  return { success: true, message: `Registrado: dormiste ${hours} horas` }
}

export async function updateSleep(
  patientId: string,
  hours: number,
  awaitResponse: boolean = true
) {
  console.log(`[TOOL] updateSleep llamada con hours: ${hours}`)
  
  const { data: latest, error: findError } = await supabase
    .from('sleep_logs')
    .select('id, hours')
    .eq('patient_id', patientId)
    .order('date', { ascending: false })
    .limit(1)
    .single()
  
  if (findError || !latest) {
    console.error('[TOOL] No hay registros de sueño para actualizar')
    return { success: false, message: 'No hay registros de sueño para actualizar' }
  }
  
  const oldHours = latest.hours
  
  if (awaitResponse) {
    const { error: updateError } = await supabase
      .from('sleep_logs')
      .update({ hours })
      .eq('id', latest.id)
    
    if (updateError) {
      console.error('[TOOL] Error actualizando sueño:', updateError)
      return { success: false, message: 'Error al actualizar las horas de sueño' }
    }
    console.log(`[TOOL] Sueño actualizado: ${oldHours} -> ${hours} horas`)
  } else {
    supabase
      .from('sleep_logs')
      .update({ hours })
      .eq('id', latest.id)
      .then(({ error }) => {
        if (error) {
          console.error('[TOOL] Error actualizando sueño:', error)
        } else {
          console.log(`[TOOL] Sueño actualizado: ${oldHours} -> ${hours} horas`)
        }
      })
  }
  
  return { success: true, message: `Horas de sueño actualizadas de ${oldHours} a ${hours}` }
}

// ============================================
// AI SDK Tool wrappers
// ============================================

export function createSleepTools(patientId: string) {
  return {
    save_sleep: tool({
      description: 'Registra las horas de sueño del paciente. Usa cuando el usuario mencione cuántas horas durmió.',
      inputSchema: z.object({
        hours: z.number().describe('Cantidad de horas de sueño'),
      }),
      execute: async ({ hours }) => saveSleep(patientId, hours, 'whatsapp', true),
    }),

    update_sleep: tool({
      description: 'Actualiza/corrige el último registro de sueño del paciente. Usa cuando el usuario quiera corregir las horas.',
      inputSchema: z.object({
        hours: z.number().describe('Nueva cantidad de horas de sueño'),
      }),
      execute: async ({ hours }) => updateSleep(patientId, hours, true),
    }),
  }
}
