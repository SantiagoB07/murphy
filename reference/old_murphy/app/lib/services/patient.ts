import { supabase } from '../supabase'

export interface Patient {
  id: string
  name: string
  age: number | null
  diabetes_type: string | null
  diagnosis_year: number | null
}

export async function getPatientByPhone(phone: string): Promise<Patient | null> {
  // Kapso envía: 573012052395 (sin +)
  // BD tiene: +573012052395 (con +)
  const phoneWithPlus = phone.startsWith('+') ? phone : '+' + phone
  
  const { data, error } = await supabase
    .from('patients')
    .select('id, name, age, diabetes_type, diagnosis_year')
    .eq('phone', phoneWithPlus)
    .single()

  if (error) {
    console.error('[SERVICE] Error buscando paciente:', error)
    return null
  }

  return data
}

export async function getPatientById(patientId: string): Promise<Patient | null> {
  const { data, error } = await supabase
    .from('patients')
    .select('id, name, age, diabetes_type, diagnosis_year')
    .eq('id', patientId)
    .single()

  if (error) {
    console.error('[SERVICE] Error buscando paciente por ID:', error)
    return null
  }

  return data
}

// Helper: Format relative time (hace 2h, ayer, etc.)
function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 60) {
    return `hace ${diffMins} min`
  } else if (diffHours < 24) {
    return `hace ${diffHours}h`
  } else if (diffDays === 1) {
    return 'ayer'
  } else if (diffDays < 7) {
    return `hace ${diffDays} días`
  } else {
    return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
  }
}

// Get last glucometries
async function getLastGlucometries(patientId: string, limit = 5) {
  const { data, error } = await supabase
    .from('glucometries')
    .select('value, measured_at')
    .eq('patient_id', patientId)
    .order('measured_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[SERVICE] Error fetching glucometries:', error)
    return []
  }
  return data || []
}

// Get last sleep logs
async function getLastSleepLogs(patientId: string, limit = 5) {
  const { data, error } = await supabase
    .from('sleep_logs')
    .select('hours, date')
    .eq('patient_id', patientId)
    .order('date', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[SERVICE] Error fetching sleep logs:', error)
    return []
  }
  return data || []
}

// Get last insulin doses
async function getLastInsulinDoses(patientId: string, limit = 5) {
  const { data, error } = await supabase
    .from('insulin_doses')
    .select('dose, unit, administered_at')
    .eq('patient_id', patientId)
    .order('administered_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[SERVICE] Error fetching insulin doses:', error)
    return []
  }
  return data || []
}

// Format glucometries
function formatGlucometries(glucometries: { value: number; measured_at: string }[]): string {
  if (glucometries.length === 0) return 'Sin registros'
  return glucometries
    .map((g) => `${g.value} mg/dL (${formatRelativeTime(new Date(g.measured_at))})`)
    .join(', ')
}

// Format sleep logs
function formatSleepLogs(sleepLogs: { hours: number; date: string }[]): string {
  if (sleepLogs.length === 0) return 'Sin registros'
  return sleepLogs
    .map((s) => `${s.hours} horas (${formatRelativeTime(new Date(s.date))})`)
    .join(', ')
}

// Format insulin doses
function formatInsulinDoses(insulinDoses: { dose: number; unit: string; administered_at: string }[]): string {
  if (insulinDoses.length === 0) return 'Sin registros'
  return insulinDoses
    .map((i) => `${i.dose} ${i.unit || 'UI'} (${formatRelativeTime(new Date(i.administered_at))})`)
    .join(', ')
}

export interface PatientContext {
  name: string
  age: string
  diabetesType: string
  diagnosisYear: string
  recentGlucometries: string
  recentSleep: string
  recentInsulin: string
}

export async function getPatientContext(patient: Patient): Promise<PatientContext> {
  // Fetch all metrics in parallel
  const [glucometries, sleepLogs, insulinDoses] = await Promise.all([
    getLastGlucometries(patient.id),
    getLastSleepLogs(patient.id),
    getLastInsulinDoses(patient.id),
  ])

  return {
    name: patient.name || 'Paciente',
    age: patient.age ? `${patient.age} años` : 'desconocida',
    diabetesType: patient.diabetes_type || 'no especificado',
    diagnosisYear: patient.diagnosis_year ? `${patient.diagnosis_year}` : 'no especificado',
    recentGlucometries: formatGlucometries(glucometries),
    recentSleep: formatSleepLogs(sleepLogs),
    recentInsulin: formatInsulinDoses(insulinDoses),
  }
}
