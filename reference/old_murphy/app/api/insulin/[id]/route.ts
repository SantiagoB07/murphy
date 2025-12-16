import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'

interface RouteParams {
  params: Promise<{ id: string }>
}

interface UpdateInsulinRequest {
  dose: number
  time?: string // Optional time in HH:mm format
  type?: 'rapid' | 'basal'
}

/**
 * PUT /api/insulin/[id]
 * Updates an insulin dose record
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const body = await request.json() as UpdateInsulinRequest
    const { dose, time, type } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Insulin ID is required' },
        { status: 400 }
      )
    }

    if (typeof dose !== 'number' || dose <= 0) {
      return NextResponse.json(
        { error: 'Valid dose is required' },
        { status: 400 }
      )
    }

    // Build update object
    const updateData: { dose: number; administered_at?: string; scheduled_time?: string } = { dose }

    if (time) {
      // Parse HH:mm and set it on today's date
      const now = new Date()
      const [hours, minutes] = time.split(':').map(Number)
      const administeredAt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes)
      updateData.administered_at = administeredAt.toISOString()
      updateData.scheduled_time = administeredAt.toTimeString().split(' ')[0]
    }

    const { data, error } = await supabase
      .from('insulin_doses')
      .update(updateData)
      .eq('id', id)
      .select('id, dose, administered_at')
      .single()

    if (error) {
      console.error('[API /insulin/[id] PUT] Error:', error)
      return NextResponse.json(
        { error: 'Failed to update insulin dose' },
        { status: 500 }
      )
    }

    return NextResponse.json({ insulin: data })
  } catch (error) {
    console.error('[API /insulin/[id] PUT] Error:', error)
    return NextResponse.json(
      { error: 'Failed to update insulin dose' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/insulin/[id]
 * Deletes an insulin dose record
 */
export async function DELETE(
  _request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'Insulin ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('insulin_doses')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[API /insulin/[id] DELETE] Error:', error)
      return NextResponse.json(
        { error: 'Failed to delete insulin dose' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API /insulin/[id] DELETE] Error:', error)
    return NextResponse.json(
      { error: 'Failed to delete insulin dose' },
      { status: 500 }
    )
  }
}
