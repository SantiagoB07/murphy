import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'

interface RouteParams {
  params: Promise<{ id: string }>
}

interface UpdateGlucometryRequest {
  value: number
  time?: string // Optional time in HH:mm format
}

/**
 * PUT /api/glucometries/[id]
 * Updates a glucometry record
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const body = await request.json() as UpdateGlucometryRequest
    const { value, time } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Glucometry ID is required' },
        { status: 400 }
      )
    }

    if (typeof value !== 'number' || value <= 0) {
      return NextResponse.json(
        { error: 'Valid value is required' },
        { status: 400 }
      )
    }

    // Build update object
    const updateData: { value: number; measured_at?: string; scheduled_time?: string } = { value }

    if (time) {
      // Parse HH:mm and set it on today's date
      const now = new Date()
      const [hours, minutes] = time.split(':').map(Number)
      const measuredAt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes)
      updateData.measured_at = measuredAt.toISOString()
      updateData.scheduled_time = measuredAt.toTimeString().split(' ')[0]
    }

    const { data, error } = await supabase
      .from('glucometries')
      .update(updateData)
      .eq('id', id)
      .select('id, value, measured_at')
      .single()

    if (error) {
      console.error('[API /glucometries/[id] PUT] Error:', error)
      return NextResponse.json(
        { error: 'Failed to update glucometry' },
        { status: 500 }
      )
    }

    return NextResponse.json({ glucometry: data })
  } catch (error) {
    console.error('[API /glucometries/[id] PUT] Error:', error)
    return NextResponse.json(
      { error: 'Failed to update glucometry' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/glucometries/[id]
 * Deletes a glucometry record
 */
export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'Glucometry ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('glucometries')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[API /glucometries/[id] DELETE] Error:', error)
      return NextResponse.json(
        { error: 'Failed to delete glucometry' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API /glucometries/[id] DELETE] Error:', error)
    return NextResponse.json(
      { error: 'Failed to delete glucometry' },
      { status: 500 }
    )
  }
}
