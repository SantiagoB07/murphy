import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'

interface CreateGlucometryRequest {
  patientId: string
  value: number
  time?: string // Optional time in HH:mm format
}

/**
 * POST /api/glucometries
 * Creates a new glucometry record
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CreateGlucometryRequest
    const { patientId, value, time } = body

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

    // Use provided time or current time
    const now = new Date()
    let measuredAt: Date
    
    if (time) {
      // Parse HH:mm and set it on today's date
      const [hours, minutes] = time.split(':').map(Number)
      measuredAt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes)
    } else {
      measuredAt = now
    }

    const { data, error } = await supabase
      .from('glucometries')
      .insert({
        patient_id: patientId,
        value,
        scheduled_time: measuredAt.toTimeString().split(' ')[0],
        measured_at: measuredAt.toISOString(),
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
