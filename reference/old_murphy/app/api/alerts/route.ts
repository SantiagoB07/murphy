import { NextRequest, NextResponse } from 'next/server'
import { getAlertsByPatient, createAlert, type AlertType, type AlertChannel } from '@/app/lib/services/alerts'

/**
 * GET /api/alerts?patientId=xxx&alertType=glucometry
 * Fetches alerts for a patient
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const patientId = searchParams.get('patientId')
  const alertType = searchParams.get('alertType') as AlertType | null

  if (!patientId) {
    return NextResponse.json(
      { error: 'patientId is required' },
      { status: 400 }
    )
  }

  try {
    const alerts = await getAlertsByPatient(patientId, {
      alertType: alertType ?? undefined,
    })

    return NextResponse.json({ alerts })
  } catch (error) {
    console.error('[API /alerts] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    )
  }
}

interface CreateAlertRequest {
  patientId: string
  alertType: AlertType
  scheduledTime: string  // "HH:MM" or "HH:MM:SS"
  channel: AlertChannel
}

/**
 * POST /api/alerts
 * Creates a new alert
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CreateAlertRequest
    const { patientId, alertType, scheduledTime, channel } = body

    if (!patientId || !alertType || !scheduledTime || !channel) {
      return NextResponse.json(
        { error: 'Missing required fields: patientId, alertType, scheduledTime, channel' },
        { status: 400 }
      )
    }

    // Ensure scheduledTime has seconds (HH:MM:SS format)
    const formattedTime = scheduledTime.length === 5 
      ? `${scheduledTime}:00` 
      : scheduledTime

    const alert = await createAlert({
      patient_id: patientId,
      alert_type: alertType,
      scheduled_time: formattedTime,
      channel,
      enabled: true,
    })

    if (!alert) {
      return NextResponse.json(
        { error: 'Failed to create alert. It may already exist for this time.' },
        { status: 409 }
      )
    }

    return NextResponse.json({ alert }, { status: 201 })
  } catch (error) {
    console.error('[API /alerts POST] Error:', error)
    return NextResponse.json(
      { error: 'Failed to create alert' },
      { status: 500 }
    )
  }
}
