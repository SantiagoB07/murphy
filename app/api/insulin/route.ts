import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'

interface CreateInsulinRequest {
  patientId: string
  dose: number
}

/**
 * POST /api/insulin
 * Creates a new insulin dose record
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CreateInsulinRequest
    const { patientId, dose } = body

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

    const now = new Date()
    const { data, error } = await supabase
      .from('insulin_doses')
      .insert({
        patient_id: patientId,
        dose,
        unit: 'units',
        scheduled_time: now.toTimeString().split(' ')[0],
        administered_at: now.toISOString(),
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
