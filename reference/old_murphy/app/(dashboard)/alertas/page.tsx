"use client";

import { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/app/components/dashboard/DashboardLayout';
import { Bell, AlertTriangle, CheckCircle, Clock, Loader2, Activity } from 'lucide-react';
import { UserRole, Glucometry, GLUCOSE_RANGES } from '@/app/types/diabetes';
import { usePatient } from '@/app/hooks/usePatients';
import { formatDistanceToNow, parseISO, subDays, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

interface VirtualAlert {
  id: string;
  type: 'warning' | 'info' | 'success';
  title: string;
  time: string;
  value: string;
  timestamp: Date; // For sorting
}

export default function AlertasPage() {
  const [userRole, setUserRole] = useState<UserRole>('patient');
  const [patientId, setPatientId] = useState<string | null>(null);

  useEffect(() => {
    const storedRole = localStorage.getItem('userRole') as UserRole;
    const storedPatientId = localStorage.getItem('murphy-patient-id');
    if (storedRole) {
      setUserRole(storedRole);
    }
    if (storedPatientId) {
      setPatientId(storedPatientId);
    }
  }, []);

  // Fetch patient data from Supabase
  const { data: currentPatient, isLoading } = usePatient(patientId);
  const userName = currentPatient?.name ?? 'Cargando...';

  // Generate virtual alerts from patient data
  const alerts = useMemo((): VirtualAlert[] => {
    if (!currentPatient) return [];

    const virtualAlerts: VirtualAlert[] = [];
    const now = new Date();
    const sevenDaysAgo = subDays(now, 7);

    // 1. Generate warnings from out-of-range glucometries (last 7 days)
    const recentGlucometries = currentPatient.glucometrias.filter(g => {
      const date = parseISO(g.timestamp);
      return isWithinInterval(date, { start: startOfDay(sevenDaysAgo), end: endOfDay(now) });
    });

    // Add warnings for high/low glucose readings
    recentGlucometries.forEach(g => {
      const date = parseISO(g.timestamp);
      
      if (g.value < GLUCOSE_RANGES.low) {
        virtualAlerts.push({
          id: `low-${g.id}`,
          type: 'warning',
          title: 'Glucosa baja detectada',
          time: formatDistanceToNow(date, { addSuffix: true, locale: es }),
          value: `${g.value} mg/dL`,
          timestamp: date,
        });
      } else if (g.value > GLUCOSE_RANGES.high) {
        virtualAlerts.push({
          id: `high-${g.id}`,
          type: 'warning',
          title: 'Glucosa alta detectada',
          time: formatDistanceToNow(date, { addSuffix: true, locale: es }),
          value: `${g.value} mg/dL`,
          timestamp: date,
        });
      }
    });

    // 2. Calculate weekly stats and add success alert if in-range % is good
    if (recentGlucometries.length >= 3) {
      const inRangeCount = recentGlucometries.filter(
        g => g.value >= GLUCOSE_RANGES.low && g.value <= GLUCOSE_RANGES.high
      ).length;
      const inRangePercent = Math.round((inRangeCount / recentGlucometries.length) * 100);

      if (inRangePercent >= 70) {
        virtualAlerts.push({
          id: 'weekly-success',
          type: 'success',
          title: 'Meta semanal cumplida',
          time: 'Esta semana',
          value: `${inRangePercent}% en rango`,
          timestamp: now,
        });
      }
    }

    // 3. Add info alerts from active reminders
    currentPatient.recordatorios
      .filter(r => r.enabled)
      .slice(0, 3) // Limit to 3 reminders
      .forEach(r => {
        virtualAlerts.push({
          id: `reminder-${r.id}`,
          type: 'info',
          title: 'Recordatorio activo',
          time: r.scheduled_time,
          value: r.alert_type === 'glucose' ? 'Medición de glucosa' : 
                 r.alert_type === 'insulin' ? 'Dosis de insulina' : 
                 r.alert_type,
          timestamp: now, // Reminders don't have a specific date
        });
      });

    // Sort by timestamp (most recent first), then by type (warnings first)
    return virtualAlerts.sort((a, b) => {
      // Warnings first
      if (a.type === 'warning' && b.type !== 'warning') return -1;
      if (a.type !== 'warning' && b.type === 'warning') return 1;
      // Then by date
      return b.timestamp.getTime() - a.timestamp.getTime();
    });
  }, [currentPatient]);

  // Loading state
  if (isLoading || !currentPatient) {
    return (
      <DashboardLayout userRole={userRole} userName="Cargando...">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole={userRole} userName={userName}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Alertas</h1>
            <p className="text-muted-foreground mt-1">Historial de notificaciones</p>
          </div>
          {alerts.length > 0 && (
            <span className="text-sm text-muted-foreground">
              {alerts.filter(a => a.type === 'warning').length} alertas
            </span>
          )}
        </div>
        
        <div className="space-y-3">
          {alerts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto rounded-full bg-muted/20 flex items-center justify-center mb-4">
                <Activity className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-foreground font-medium">Sin alertas recientes</p>
              <p className="text-sm text-muted-foreground mt-1">
                Tus glucometrías están en rango normal
              </p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div 
                key={alert.id}
                className="glass-card p-4 flex items-start gap-4"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  alert.type === 'warning' ? 'bg-warning/20' :
                  alert.type === 'success' ? 'bg-success/20' : 'bg-info/20'
                }`}>
                  {alert.type === 'warning' ? (
                    <AlertTriangle className="w-5 h-5 text-warning" />
                  ) : alert.type === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-success" />
                  ) : (
                    <Bell className="w-5 h-5 text-info" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">{alert.title}</p>
                  <p className="text-sm text-muted-foreground">{alert.value}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                  <Clock className="w-3 h-3" />
                  {alert.time}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
