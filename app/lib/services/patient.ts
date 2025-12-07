import { supabase } from '../supabase'

export async function getPatientByPhone(phone: string) {
  // phone viene sin +, agregamos el + para buscar
  const { data, error } = await supabase
    .from('patients')
    .select('id, name')
    .eq('phone', `+${phone}`)
    .single()

  if (error) {
    console.error('[SERVICE] Error buscando paciente:', error)
    return null
  }

  return data
}
