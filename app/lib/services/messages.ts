import { supabase } from '../supabase'

interface ToolCall {
  toolName: string
  args: Record<string, unknown>
}

interface SaveMessageParams {
  patientId: string
  userMessage: string
  botResponse: string
  toolCalls?: ToolCall[]
  source?: string
}

export async function saveMessage(params: SaveMessageParams) {
  const { error } = await supabase.from('messages').insert({
    patient_id: params.patientId,
    user_message: params.userMessage,
    bot_response: params.botResponse,
    tool_calls: params.toolCalls?.length ? params.toolCalls : null,
    source: params.source || 'whatsapp',
  })

  if (error) {
    console.error('[SERVICE] Error guardando mensaje:', error)
    return false
  }

  console.log('[SERVICE] Mensaje guardado')
  return true
}

export interface Message {
  user_message: string
  bot_response: string
}

export async function getMessageHistory(patientId: string, limit: number = 10): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('user_message, bot_response')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[SERVICE] Error obteniendo historial:', error)
    return []
  }

  // Viene en orden descendente (más reciente primero), lo invertimos para orden cronológico
  return (data || []).reverse()
}
