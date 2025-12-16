import { NextRequest, NextResponse } from 'next/server'
import { deleteAlert } from '@/app/lib/services/alerts'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * DELETE /api/alerts/[id]
 * Deletes an alert by ID
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'Alert ID is required' },
        { status: 400 }
      )
    }

    const success = await deleteAlert(id)

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete alert' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API /alerts/[id] DELETE] Error:', error)
    return NextResponse.json(
      { error: 'Failed to delete alert' },
      { status: 500 }
    )
  }
}
