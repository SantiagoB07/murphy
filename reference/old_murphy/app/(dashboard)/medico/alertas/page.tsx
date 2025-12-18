"use client";

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Clock, ChevronRight, Filter, Loader2 } from 'lucide-react';
import { MedicoLayout } from '@/app/components/medico/MedicoLayout';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Card, CardContent } from '@/app/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { cn } from '@/app/lib/utils';
import { usePatientsWithData } from '@/app/hooks/usePatients';
import { Reminder } from '@/app/types/diabetes';

// Hardcoded doctor for now (no doctors table in Supabase)
const MOCK_DOCTOR = {
  id: 'd001',
  name: 'Dr. Alejandro Méndez',
  specialty: 'Endocrinología',
};

type GroupBy = 'patient' | 'type';

interface ReminderWithPatient extends Reminder {
  patientId: string;
  patientName: string;
}

export default function MedicoAlertasPage() {
  const router = useRouter();
  const [groupBy, setGroupBy] = useState<GroupBy>('patient');
  const [showDisabled, setShowDisabled] = useState(false);

  // Fetch all patients with their data
  const { data: patients, isLoading } = usePatientsWithData();
  const assignedPatients = patients ?? [];

  // Collect all reminders from assigned patients
  const allReminders = useMemo(() => {
    const reminders: ReminderWithPatient[] = [];
    assignedPatients.forEach(patient => {
      patient.recordatorios.forEach(reminder => {
        reminders.push({
          ...reminder,
          patientId: patient.id,
          patientName: patient.name,
        });
      });
    });
    return reminders;
  }, [assignedPatients]);

  // Filter reminders
  const filteredReminders = useMemo(() => {
    let reminders = allReminders;
    if (!showDisabled) {
      reminders = reminders.filter(r => r.enabled);
    }
    return reminders.sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time));
  }, [allReminders, showDisabled]);

  // Group reminders
  const groupedReminders = useMemo(() => {
    const groups: Record<string, ReminderWithPatient[]> = {};
    
    filteredReminders.forEach(reminder => {
      const key = groupBy === 'patient' ? reminder.patientName : reminder.alert_type;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(reminder);
    });

    const sortedKeys = Object.keys(groups).sort();

    return sortedKeys.map(key => ({
      key,
      reminders: groups[key],
    }));
  }, [filteredReminders, groupBy]);

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'glucose':
        return 'Glucometría';
      case 'insulin':
        return 'Insulina';
      case 'medication':
        return 'Medicación';
      default:
        return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'glucose':
        return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
      case 'insulin':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      case 'medication':
        return 'bg-warning/15 text-warning border-warning/30';
      default:
        return 'bg-muted/15 text-muted-foreground border-muted/30';
    }
  };

  const enabledCount = allReminders.filter(r => r.enabled).length;

  if (isLoading) {
    return (
      <MedicoLayout doctorName={MOCK_DOCTOR.name}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </MedicoLayout>
    );
  }

  return (
    <MedicoLayout doctorName={MOCK_DOCTOR.name}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-hig-2xl font-bold text-foreground flex items-center gap-3">
              <Bell className="w-7 h-7 text-primary" />
              Recordatorios
              {enabledCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {enabledCount} activos
                </Badge>
              )}
            </h1>
            <p className="text-muted-foreground mt-1">
              Recordatorios programados de tus pacientes
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupBy)}>
            <SelectTrigger className="w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Agrupar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="patient">Por paciente</SelectItem>
              <SelectItem value="type">Por tipo</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant={showDisabled ? "default" : "outline"}
            size="sm"
            onClick={() => setShowDisabled(!showDisabled)}
          >
            {showDisabled ? 'Ocultar desactivados' : 'Mostrar desactivados'}
          </Button>
        </div>

        {/* Reminders List */}
        <div className="space-y-6">
          {groupedReminders.map(({ key, reminders }) => (
            <div key={key} className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                {groupBy === 'type' && (
                  <Badge variant="outline" className={cn("capitalize", getTypeColor(key))}>
                    {getTypeLabel(key)}
                  </Badge>
                )}
                {groupBy === 'patient' && key}
                <span className="text-sm font-normal text-muted-foreground">
                  ({reminders.length})
                </span>
              </h2>
              
              <div className="space-y-2">
                {reminders.map(reminder => (
                  <Card 
                    key={reminder.id}
                    className={cn(
                      "glass-card cursor-pointer transition-all hover:shadow-elevation-2",
                      !reminder.enabled && "opacity-60"
                    )}
                    onClick={() => router.push(`/medico/paciente/${reminder.patientId}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-hig flex items-center justify-center",
                            getTypeColor(reminder.alert_type)
                          )}>
                            <Clock className="w-5 h-5" />
                          </div>
                          <div>
                            {groupBy === 'type' && (
                              <p className="text-sm text-muted-foreground mb-1">
                                {reminder.patientName}
                              </p>
                            )}
                            <p className="text-foreground font-medium">
                              {getTypeLabel(reminder.alert_type)} - {reminder.scheduled_time}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Canal: {reminder.channel}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={reminder.enabled ? "default" : "outline"}>
                            {reminder.enabled ? 'Activo' : 'Desactivado'}
                          </Badge>
                          <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>

        {filteredReminders.length === 0 && (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {showDisabled 
                ? 'No hay recordatorios para mostrar.'
                : 'No hay recordatorios activos.'
              }
            </p>
          </div>
        )}
      </div>
    </MedicoLayout>
  );
}
