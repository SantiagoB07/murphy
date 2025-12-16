import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// ============================================
// Helper functions
// ============================================

function daysAgo(days: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d
}

function setTime(date: Date, hour: number, minute: number = 0): Date {
  const d = new Date(date)
  d.setHours(hour, minute, 0, 0)
  return d
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

function formatTime(date: Date): string {
  return date.toTimeString().split(' ')[0]
}

// ============================================
// Seed Data
// ============================================

async function seed() {
  console.log('🌱 Murphy Database Seed')
  console.log('========================\n')

  // ----------------------------------------
  // Step 1: Clear existing data
  // ----------------------------------------
  console.log('🗑️  Limpiando datos existentes...')
  
  const tables = ['symptom_logs', 'sleep_logs', 'insulin_doses', 'glucometries', 'messages', 'alerts', 'treatment_schedule', 'patients']
  
  for (const table of tables) {
    const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000')
    if (error && !error.message.includes('does not exist')) {
      console.log(`   ⚠️  ${table}: ${error.message}`)
    } else {
      console.log(`   ✓ ${table} limpiada`)
    }
  }

  // ----------------------------------------
  // Step 2: Insert patients
  // ----------------------------------------
  console.log('\n👥 Insertando pacientes...')
  
  const patientsData = [
    { 
      name: 'María García López', 
      phone: '+573012052395',  // Tu número para pruebas
      age: 45, 
      diabetes_type: 'Tipo 2', 
      diagnosis_year: 2019 
    },
    { 
      name: 'Carlos Rodríguez Sánchez', 
      phone: '+573009876543', 
      age: 62, 
      diabetes_type: 'Tipo 2', 
      diagnosis_year: 2015 
    },
    { 
      name: 'Ana Martínez Ruiz', 
      phone: '+573005551234', 
      age: 34, 
      diabetes_type: 'Tipo 1', 
      diagnosis_year: 2010 
    },
  ]

  const { data: patients, error: patientsError } = await supabase
    .from('patients')
    .insert(patientsData)
    .select()

  if (patientsError) {
    console.error('❌ Error insertando pacientes:', patientsError)
    process.exit(1)
  }

  const [maria, carlos, ana] = patients!
  console.log(`   ✓ ${patients!.length} pacientes creados`)
  console.log(`   📱 Tu número (+573012052395) → ${maria.name} (ID: ${maria.id})`)

  // ----------------------------------------
  // Step 3: Insert glucometries (7 days)
  // ----------------------------------------
  console.log('\n🩸 Insertando glucometrías...')

  const glucometries: {
    patient_id: string
    value: number
    scheduled_time: string
    measured_at: string
    source: string
  }[] = []

  // María - Control moderado (120-180 mg/dL)
  const mariaValues = [
    // Día 0 (hoy)
    { day: 0, hour: 7, min: 0, value: 142 },   // before_breakfast
    { day: 0, hour: 9, min: 15, value: 168 },  // after_breakfast
    { day: 0, hour: 12, min: 0, value: 125 },  // before_lunch
    { day: 0, hour: 14, min: 30, value: 155 }, // after_lunch
    { day: 0, hour: 18, min: 30, value: 132 }, // before_dinner
    { day: 0, hour: 21, min: 0, value: 148 },  // after_dinner
    // Día 1 (ayer)
    { day: 1, hour: 7, min: 30, value: 138 },
    { day: 1, hour: 9, min: 30, value: 175 },
    { day: 1, hour: 12, min: 15, value: 128 },
    { day: 1, hour: 14, min: 45, value: 162 },
    { day: 1, hour: 19, min: 0, value: 130 },
    // Día 2
    { day: 2, hour: 7, min: 15, value: 145 },
    { day: 2, hour: 9, min: 20, value: 182 },
    { day: 2, hour: 12, min: 30, value: 135 },
    { day: 2, hour: 14, min: 30, value: 158 },
    // Día 3
    { day: 3, hour: 7, min: 0, value: 140 },
    { day: 3, hour: 9, min: 45, value: 170 },
    { day: 3, hour: 18, min: 45, value: 138 },
    { day: 3, hour: 21, min: 15, value: 152 },
    // Día 4
    { day: 4, hour: 7, min: 30, value: 148 },
    { day: 4, hour: 12, min: 0, value: 130 },
    { day: 4, hour: 14, min: 15, value: 165 },
    // Día 5
    { day: 5, hour: 7, min: 0, value: 135 },
    { day: 5, hour: 9, min: 30, value: 178 },
    { day: 5, hour: 19, min: 0, value: 128 },
    // Día 6
    { day: 6, hour: 7, min: 15, value: 142 },
    { day: 6, hour: 9, min: 15, value: 168 },
    { day: 6, hour: 12, min: 30, value: 132 },
  ]

  for (const v of mariaValues) {
    const date = setTime(daysAgo(v.day), v.hour, v.min)
    glucometries.push({
      patient_id: maria.id,
      value: v.value,
      scheduled_time: formatTime(date),
      measured_at: date.toISOString(),
      source: 'whatsapp',
    })
  }

  // Carlos - Mal control (150-250 mg/dL, menos registros)
  const carlosValues = [
    { day: 0, hour: 7, min: 0, value: 198 },
    { day: 0, hour: 14, min: 0, value: 245 },
    { day: 1, hour: 7, min: 15, value: 178 },
    { day: 1, hour: 14, min: 30, value: 232 },
    { day: 2, hour: 7, min: 30, value: 185 },
    { day: 2, hour: 21, min: 0, value: 210 },
    { day: 3, hour: 7, min: 0, value: 195 },
    { day: 4, hour: 7, min: 45, value: 188 },
    { day: 4, hour: 14, min: 0, value: 255 },
    { day: 5, hour: 7, min: 0, value: 172 },
    { day: 6, hour: 7, min: 30, value: 190 },
    { day: 6, hour: 14, min: 15, value: 228 },
  ]

  for (const v of carlosValues) {
    const date = setTime(daysAgo(v.day), v.hour, v.min)
    glucometries.push({
      patient_id: carlos.id,
      value: v.value,
      scheduled_time: formatTime(date),
      measured_at: date.toISOString(),
      source: 'whatsapp',
    })
  }

  // Ana - Buen control (80-140 mg/dL, registros completos)
  const anaValues = [
    // Día 0 (hoy) - completo
    { day: 0, hour: 7, min: 0, value: 98 },
    { day: 0, hour: 9, min: 30, value: 132 },
    { day: 0, hour: 12, min: 0, value: 105 },
    { day: 0, hour: 14, min: 15, value: 138 },
    { day: 0, hour: 19, min: 0, value: 108 },
    { day: 0, hour: 21, min: 0, value: 125 },
    // Día 1 - completo
    { day: 1, hour: 7, min: 15, value: 92 },
    { day: 1, hour: 9, min: 20, value: 128 },
    { day: 1, hour: 12, min: 15, value: 100 },
    { day: 1, hour: 14, min: 30, value: 135 },
    { day: 1, hour: 18, min: 45, value: 102 },
    { day: 1, hour: 21, min: 15, value: 118 },
    // Día 2 - completo
    { day: 2, hour: 7, min: 0, value: 95 },
    { day: 2, hour: 9, min: 15, value: 130 },
    { day: 2, hour: 12, min: 0, value: 98 },
    { day: 2, hour: 14, min: 0, value: 140 },
    { day: 2, hour: 19, min: 0, value: 105 },
    { day: 2, hour: 20, min: 45, value: 122 },
    // Día 3
    { day: 3, hour: 7, min: 30, value: 88 },
    { day: 3, hour: 9, min: 30, value: 125 },
    { day: 3, hour: 12, min: 30, value: 95 },
    { day: 3, hour: 14, min: 15, value: 132 },
    { day: 3, hour: 18, min: 30, value: 100 },
    { day: 3, hour: 21, min: 0, value: 115 },
    // Día 4
    { day: 4, hour: 7, min: 0, value: 90 },
    { day: 4, hour: 9, min: 45, value: 128 },
    { day: 4, hour: 12, min: 0, value: 102 },
    { day: 4, hour: 14, min: 30, value: 136 },
    // Día 5
    { day: 5, hour: 7, min: 15, value: 94 },
    { day: 5, hour: 9, min: 15, value: 130 },
    { day: 5, hour: 18, min: 45, value: 98 },
    { day: 5, hour: 21, min: 30, value: 120 },
    // Día 6
    { day: 6, hour: 7, min: 0, value: 96 },
    { day: 6, hour: 9, min: 30, value: 125 },
    { day: 6, hour: 12, min: 15, value: 100 },
    { day: 6, hour: 14, min: 0, value: 138 },
  ]

  for (const v of anaValues) {
    const date = setTime(daysAgo(v.day), v.hour, v.min)
    glucometries.push({
      patient_id: ana.id,
      value: v.value,
      scheduled_time: formatTime(date),
      measured_at: date.toISOString(),
      source: 'whatsapp',
    })
  }

  const { error: glucError } = await supabase.from('glucometries').insert(glucometries)
  if (glucError) {
    console.error('❌ Error insertando glucometrías:', glucError)
  } else {
    console.log(`   ✓ ${glucometries.length} glucometrías creadas`)
  }

  // ----------------------------------------
  // Step 4: Insert insulin doses
  // ----------------------------------------
  console.log('\n💉 Insertando dosis de insulina...')

  const insulinDoses: {
    patient_id: string
    dose: number
    unit: string
    scheduled_time: string
    administered_at: string
    source: string
  }[] = []

  // María - Basal + Rápida
  const mariaInsulin = [
    { day: 0, hour: 7, min: 35, dose: 12 },  // Rápida desayuno
    { day: 0, hour: 12, min: 55, dose: 10 }, // Rápida almuerzo
    { day: 0, hour: 22, min: 0, dose: 24 },  // Basal noche
    { day: 1, hour: 7, min: 30, dose: 12 },
    { day: 1, hour: 13, min: 0, dose: 10 },
    { day: 1, hour: 22, min: 0, dose: 24 },
    { day: 2, hour: 7, min: 40, dose: 12 },
    { day: 2, hour: 22, min: 0, dose: 24 },
    { day: 3, hour: 7, min: 25, dose: 12 },
    { day: 3, hour: 22, min: 0, dose: 24 },
  ]

  for (const v of mariaInsulin) {
    const date = setTime(daysAgo(v.day), v.hour, v.min)
    insulinDoses.push({
      patient_id: maria.id,
      dose: v.dose,
      unit: 'units',
      scheduled_time: formatTime(date),
      administered_at: date.toISOString(),
      source: 'whatsapp',
    })
  }

  // Carlos - Dosis más altas
  const carlosInsulin = [
    { day: 0, hour: 8, min: 5, dose: 16 },
    { day: 0, hour: 22, min: 0, dose: 32 },
    { day: 1, hour: 8, min: 0, dose: 16 },
    { day: 1, hour: 22, min: 0, dose: 32 },
    { day: 2, hour: 8, min: 15, dose: 14 },
    { day: 2, hour: 22, min: 0, dose: 32 },
    { day: 3, hour: 22, min: 0, dose: 32 },
    { day: 4, hour: 8, min: 0, dose: 16 },
    { day: 4, hour: 22, min: 0, dose: 32 },
  ]

  for (const v of carlosInsulin) {
    const date = setTime(daysAgo(v.day), v.hour, v.min)
    insulinDoses.push({
      patient_id: carlos.id,
      dose: v.dose,
      unit: 'units',
      scheduled_time: formatTime(date),
      administered_at: date.toISOString(),
      source: 'whatsapp',
    })
  }

  // Ana - Múltiples dosis (Tipo 1)
  const anaInsulin = [
    { day: 0, hour: 7, min: 5, dose: 8 },   // Rápida desayuno
    { day: 0, hour: 13, min: 25, dose: 6 }, // Rápida almuerzo
    { day: 0, hour: 18, min: 55, dose: 7 }, // Rápida cena
    { day: 0, hour: 22, min: 0, dose: 18 }, // Basal
    { day: 1, hour: 7, min: 10, dose: 8 },
    { day: 1, hour: 13, min: 20, dose: 6 },
    { day: 1, hour: 19, min: 0, dose: 7 },
    { day: 1, hour: 22, min: 0, dose: 18 },
    { day: 2, hour: 7, min: 0, dose: 8 },
    { day: 2, hour: 13, min: 30, dose: 6 },
    { day: 2, hour: 19, min: 5, dose: 7 },
    { day: 2, hour: 22, min: 0, dose: 18 },
    { day: 3, hour: 7, min: 15, dose: 8 },
    { day: 3, hour: 22, min: 0, dose: 18 },
  ]

  for (const v of anaInsulin) {
    const date = setTime(daysAgo(v.day), v.hour, v.min)
    insulinDoses.push({
      patient_id: ana.id,
      dose: v.dose,
      unit: 'units',
      scheduled_time: formatTime(date),
      administered_at: date.toISOString(),
      source: 'whatsapp',
    })
  }

  const { error: insulinError } = await supabase.from('insulin_doses').insert(insulinDoses)
  if (insulinError) {
    console.error('❌ Error insertando insulina:', insulinError)
  } else {
    console.log(`   ✓ ${insulinDoses.length} dosis de insulina creadas`)
  }

  // ----------------------------------------
  // Step 5: Insert sleep logs (7 days each)
  // ----------------------------------------
  console.log('\n😴 Insertando registros de sueño...')

  const sleepLogs: {
    patient_id: string
    hours: number
    date: string
    source: string
  }[] = []

  // María - 6-7 horas
  const mariaSleep = [6.5, 7.2, 5.8, 6.0, 7.0, 6.5, 7.5]
  // Carlos - 4-5.5 horas (mal descanso)
  const carlosSleep = [5.0, 5.5, 4.5, 4.0, 5.0, 4.5, 5.5]
  // Ana - 7-8 horas (buen descanso)
  const anaSleep = [8.0, 7.5, 8.0, 7.0, 7.5, 8.0, 7.5]

  for (let i = 0; i < 7; i++) {
    sleepLogs.push({
      patient_id: maria.id,
      hours: mariaSleep[i],
      date: formatDate(daysAgo(i)),
      source: 'whatsapp',
    })
    sleepLogs.push({
      patient_id: carlos.id,
      hours: carlosSleep[i],
      date: formatDate(daysAgo(i)),
      source: 'whatsapp',
    })
    sleepLogs.push({
      patient_id: ana.id,
      hours: anaSleep[i],
      date: formatDate(daysAgo(i)),
      source: 'whatsapp',
    })
  }

  const { error: sleepError } = await supabase.from('sleep_logs').insert(sleepLogs)
  if (sleepError) {
    console.error('❌ Error insertando sueño:', sleepError)
  } else {
    console.log(`   ✓ ${sleepLogs.length} registros de sueño creados`)
  }

  // ----------------------------------------
  // Step 6: Insert symptom logs
  // ----------------------------------------
  console.log('\n🤒 Insertando síntomas...')

  const symptomLogs: {
    patient_id: string
    symptom_type: string
    value: boolean
    date: string
    source: string
  }[] = []

  // María - stress algunos días
  symptomLogs.push({ patient_id: maria.id, symptom_type: 'stress', value: true, date: formatDate(daysAgo(0)), source: 'whatsapp' })
  symptomLogs.push({ patient_id: maria.id, symptom_type: 'stress', value: true, date: formatDate(daysAgo(2)), source: 'whatsapp' })
  symptomLogs.push({ patient_id: maria.id, symptom_type: 'stress', value: false, date: formatDate(daysAgo(4)), source: 'whatsapp' })
  symptomLogs.push({ patient_id: maria.id, symptom_type: 'dizziness', value: false, date: formatDate(daysAgo(0)), source: 'whatsapp' })

  // Carlos - stress y mareos frecuentes
  symptomLogs.push({ patient_id: carlos.id, symptom_type: 'stress', value: true, date: formatDate(daysAgo(0)), source: 'whatsapp' })
  symptomLogs.push({ patient_id: carlos.id, symptom_type: 'stress', value: true, date: formatDate(daysAgo(1)), source: 'whatsapp' })
  symptomLogs.push({ patient_id: carlos.id, symptom_type: 'stress', value: true, date: formatDate(daysAgo(3)), source: 'whatsapp' })
  symptomLogs.push({ patient_id: carlos.id, symptom_type: 'dizziness', value: true, date: formatDate(daysAgo(0)), source: 'whatsapp' })
  symptomLogs.push({ patient_id: carlos.id, symptom_type: 'dizziness', value: true, date: formatDate(daysAgo(2)), source: 'whatsapp' })

  // Ana - sin síntomas
  symptomLogs.push({ patient_id: ana.id, symptom_type: 'stress', value: false, date: formatDate(daysAgo(0)), source: 'whatsapp' })
  symptomLogs.push({ patient_id: ana.id, symptom_type: 'dizziness', value: false, date: formatDate(daysAgo(0)), source: 'whatsapp' })

  const { error: symptomError } = await supabase.from('symptom_logs').insert(symptomLogs)
  if (symptomError) {
    console.error('❌ Error insertando síntomas:', symptomError)
  } else {
    console.log(`   ✓ ${symptomLogs.length} registros de síntomas creados`)
  }

  // ----------------------------------------
  // Step 7: Insert treatment schedule
  // ----------------------------------------
  console.log('\n📋 Insertando treatment schedule...')

  const treatmentSchedule: {
    patient_id: string
    type: 'glucose' | 'insulin'
    scheduled_time: string
    label: string
    expected_dose: number | null
    insulin_type: string | null
    enabled: boolean
  }[] = []

  // María - Tipo 2: 3 glucometrías + 3 insulinas (rápida 2x + basal 1x)
  const mariaSchedule = [
    // Glucometrías
    { type: 'glucose' as const, time: '07:00:00', label: 'Antes del desayuno', dose: null, insulinType: null },
    { type: 'glucose' as const, time: '12:00:00', label: 'Antes del almuerzo', dose: null, insulinType: null },
    { type: 'glucose' as const, time: '19:00:00', label: 'Antes de la cena', dose: null, insulinType: null },
    // Insulinas
    { type: 'insulin' as const, time: '07:30:00', label: 'Desayuno', dose: 12, insulinType: 'rapid' },
    { type: 'insulin' as const, time: '12:30:00', label: 'Almuerzo', dose: 10, insulinType: 'rapid' },
    { type: 'insulin' as const, time: '22:00:00', label: 'Noche', dose: 24, insulinType: 'basal' },
  ]

  for (const s of mariaSchedule) {
    treatmentSchedule.push({
      patient_id: maria.id,
      type: s.type,
      scheduled_time: s.time,
      label: s.label,
      expected_dose: s.dose,
      insulin_type: s.insulinType,
      enabled: true,
    })
  }

  // Carlos - Tipo 2: 2 glucometrías + 2 insulinas (rápida 1x + basal 1x)
  const carlosSchedule = [
    // Glucometrías - menos mediciones
    { type: 'glucose' as const, time: '07:30:00', label: 'Mañana', dose: null, insulinType: null },
    { type: 'glucose' as const, time: '14:00:00', label: 'Tarde', dose: null, insulinType: null },
    // Insulinas - dosis más altas
    { type: 'insulin' as const, time: '08:00:00', label: 'Mañana', dose: 16, insulinType: 'rapid' },
    { type: 'insulin' as const, time: '22:00:00', label: 'Noche', dose: 32, insulinType: 'basal' },
  ]

  for (const s of carlosSchedule) {
    treatmentSchedule.push({
      patient_id: carlos.id,
      type: s.type,
      scheduled_time: s.time,
      label: s.label,
      expected_dose: s.dose,
      insulin_type: s.insulinType,
      enabled: true,
    })
  }

  // Ana - Tipo 1: 6 glucometrías + 4 insulinas (rápida 3x + basal 1x)
  const anaSchedule = [
    // Glucometrías - control intensivo
    { type: 'glucose' as const, time: '07:00:00', label: 'Antes del desayuno', dose: null, insulinType: null },
    { type: 'glucose' as const, time: '09:30:00', label: 'Después del desayuno', dose: null, insulinType: null },
    { type: 'glucose' as const, time: '12:00:00', label: 'Antes del almuerzo', dose: null, insulinType: null },
    { type: 'glucose' as const, time: '14:00:00', label: 'Después del almuerzo', dose: null, insulinType: null },
    { type: 'glucose' as const, time: '19:00:00', label: 'Antes de la cena', dose: null, insulinType: null },
    { type: 'glucose' as const, time: '21:00:00', label: 'Después de la cena', dose: null, insulinType: null },
    // Insulinas - múltiples dosis
    { type: 'insulin' as const, time: '07:05:00', label: 'Desayuno', dose: 8, insulinType: 'rapid' },
    { type: 'insulin' as const, time: '13:00:00', label: 'Almuerzo', dose: 6, insulinType: 'rapid' },
    { type: 'insulin' as const, time: '19:00:00', label: 'Cena', dose: 7, insulinType: 'rapid' },
    { type: 'insulin' as const, time: '22:00:00', label: 'Noche', dose: 18, insulinType: 'basal' },
  ]

  for (const s of anaSchedule) {
    treatmentSchedule.push({
      patient_id: ana.id,
      type: s.type,
      scheduled_time: s.time,
      label: s.label,
      expected_dose: s.dose,
      insulin_type: s.insulinType,
      enabled: true,
    })
  }

  const { error: scheduleError } = await supabase.from('treatment_schedule').insert(treatmentSchedule)
  if (scheduleError) {
    console.error('❌ Error insertando treatment schedule:', scheduleError)
  } else {
    console.log(`   ✓ ${treatmentSchedule.length} slots de tratamiento creados`)
  }

  // ----------------------------------------
  // Summary
  // ----------------------------------------
  console.log('\n========================')
  console.log('✅ Seed completado!\n')
  console.log('📊 Resumen:')
  console.log(`   • Pacientes:     3`)
  console.log(`   • Glucometrías:  ${glucometries.length}`)
  console.log(`   • Insulina:      ${insulinDoses.length}`)
  console.log(`   • Sueño:         ${sleepLogs.length}`)
  console.log(`   • Síntomas:      ${symptomLogs.length}`)
  console.log(`   • Treatment:     ${treatmentSchedule.length}`)
  console.log('\n📱 Pacientes creados:')
  console.log(`   1. ${maria.name} (${maria.phone}) - ${maria.diabetes_type}`)
  console.log(`   2. ${carlos.name} (${carlos.phone}) - ${carlos.diabetes_type}`)
  console.log(`   3. ${ana.name} (${ana.phone}) - ${ana.diabetes_type}`)
  console.log('\n🔑 Tu número para pruebas: +573012052395')
}

seed().catch((err) => {
  console.error('❌ Error en seed:', err)
  process.exit(1)
})
