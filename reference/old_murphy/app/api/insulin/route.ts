import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'

interface CreateInsulinRequest {
  patientId: string
  dose: number
  time?: string // Optional time in HH:mm format
  type?: 'rapid' | 'basal'
}

/**
 * POST /api/insulin
 * Creates a new insulin dose record
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CreateInsulinRequest
    const { patientId, dose, time, type } = body

    if (!patientId) {
      return NextResponse.json(
        { error: 'Patient ID is required' },
        { status: 400 }
      )
    }

    if (typeof dose !== 'number' || dose <= 0) {
      return NextResponse.json(
        { error: 'Valid dose is required' },
        { status: 400 }
      )
    }

    // Use provided time or current time
    const now = new Date()
    let administeredAt: Date
    
    if (time) {
      // Parse HH:mm and set it on today's date
      const [hours, minutes] = time.split(':').map(Number)
      administeredAt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes)
    } else {
      administeredAt = now
    }

    const { data, error } = await supabase
      .from('insulin_doses')
      .insert({
        patient_id: patientId,
        dose,
        unit: 'units',
        scheduled_time: administeredAt.toTimeString().split(' ')[0],
        administered_at: administeredAt.toISOString(),
        source: 'app',
      })
      .select('id, dose, administered_at')
      .single()

    if (error) {
      console.error('[API /insulin POST] Error:', error)
      return NextResponse.json(
        { error: 'Failed to create insulin dose' },
        { status: 500 }
      )
    }

    return NextResponse.json({ insulin: data })
  } catch (error) {
    console.error('[API /insulin POST] Error:', error)
    return NextResponse.json(
      { error: 'Failed to create insulin dose' },
      { status: 500 }
    )
  }
}
