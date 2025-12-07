import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'

interface CreateGlucometryRequest {
  patientId: string
  value: number
}

/**
 * POST /api/glucometries
 * Creates a new glucometry record
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CreateGlucometryRequest
    const { patientId, value } = body

    if (!patientId) {
      return NextResponse.json(
        { error: 'Patient ID is required' },
        { status: 400 }
      )
    }

    if (typeof value !== 'number' || value <= 0) {
      return NextResponse.json(
        { error: 'Valid value is required' },
        { status: 400 }
      )
    }

    const now = new Date()
    const { data, error } = await supabase
      .from('glucometries')
      .insert({
        patient_id: patientId,
        value,
        scheduled_time: now.toTimeString().split(' ')[0],
        measured_at: now.toISOString(),
        source: 'app',
      })
      .select('id, value, measured_at')
      .single()

    if (error) {
      console.error('[API /glucometries POST] Error:', error)
      return NextResponse.json(
        { error: 'Failed to create glucometry' },
        { status: 500 }
      )
    }

    return NextResponse.json({ glucometry: data })
  } catch (error) {
    console.error('[API /glucometries POST] Error:', error)
    return NextResponse.json(
      { error: 'Failed to create glucometry' },
      { status: 500 }
    )
  }
}
