import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, AlertTriangle, ChevronRight, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MedicoLayout } from '@/components/medico/MedicoLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import mockData from '@/data/mockPatients.json';
import { Patient, Doctor, Alert } from '@/types/diabetes';

type GroupBy = 'patient' | 'severity';

interface AlertWithPatient extends Alert {
  patientId: string;
  patientName: string;
}

export default function MedicoAlertas() {
  const navigate = useNavigate();
  const [groupBy, setGroupBy] = useState<GroupBy>('severity');
  const [showResolved, setShowResolved] = useState(false);

  const currentDoctor = mockData.doctors[0] as Doctor;
  
  const assignedPatients = useMemo(() => {
    return (mockData.patients as Patient[]).filter(
      patient => currentDoctor.patientIds.includes(patient.id)
    );
  }, [currentDoctor.patientIds]);

  // Collect all alerts from assigned patients
  const allAlerts = useMemo(() => {
    const alerts: AlertWithPatient[] = [];
    assignedPatients.forEach(patient => {
      patient.alertas.forEach(alert => {
        alerts.push({
          ...alert,
          patientId: patient.id,
          patientName: patient.name,
        });
      });
    });
    return alerts;
  }, [assignedPatients]);

  // Filter alerts
  const filteredAlerts = useMemo(() => {
    let alerts = allAlerts;
    if (!showResolved) {
      alerts = alerts.filter(a => !a.resolved);
    }
    return alerts.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [allAlerts, showResolved]);

  // Group alerts
  const groupedAlerts = useMemo(() => {
    const groups: Record<string, AlertWithPatient[]> = {};
    
    filteredAlerts.forEach(alert => {
      const key = groupBy === 'patient' ? alert.patientName : alert.severity;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(alert);
    });

    // Sort groups
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      if (groupBy === 'severity') {
        const order = { critical: 0, warning: 1, info: 2 };
        return (order[a as keyof typeof order] || 3) - (order[b as keyof typeof order] || 3);
      }
      return a.localeCompare(b);
    });

    return sortedKeys.map(key => ({
      key,
      alerts: groups[key],
    }));
  }, [filteredAlerts, groupBy]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-destructive/15 text-destructive border-destructive/30';
      case 'warning':
        return 'bg-warning/15 text-warning border-warning/30';
      default:
        return 'bg-info/15 text-info border-info/30';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'Crítica';
      case 'warning':
        return 'Advertencia';
      default:
        return 'Info';
    }
  };

  const unresolvedCount = allAlerts.filter(a => !a.resolved).length;

  return (
    <MedicoLayout doctorName={currentDoctor.name}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-hig-2xl font-bold text-foreground flex items-center gap-3">
              <Bell className="w-7 h-7 text-primary" />
              Alertas
              {unresolvedCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unresolvedCount} sin resolver
                </Badge>
              )}
            </h1>
            <p className="text-muted-foreground mt-1">
              Alertas de todos tus pacientes
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
              <SelectItem value="severity">Por severidad</SelectItem>
              <SelectItem value="patient">Por paciente</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant={showResolved ? "default" : "outline"}
            size="sm"
            onClick={() => setShowResolved(!showResolved)}
          >
            {showResolved ? 'Ocultar resueltas' : 'Mostrar resueltas'}
          </Button>
        </div>

        {/* Alerts List */}
        <div className="space-y-6">
          {groupedAlerts.map(({ key, alerts }) => (
            <div key={key} className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                {groupBy === 'severity' && (
                  <Badge variant="outline" className={cn("capitalize", getSeverityColor(key))}>
                    {getSeverityLabel(key)}
                  </Badge>
                )}
                {groupBy === 'patient' && key}
                <span className="text-sm font-normal text-muted-foreground">
                  ({alerts.length})
                </span>
              </h2>
              
              <div className="space-y-2">
                {alerts.map(alert => (
                  <Card 
                    key={alert.id}
                    className={cn(
                      "glass-card cursor-pointer transition-all hover:shadow-elevation-2",
                      alert.resolved && "opacity-60"
                    )}
                    onClick={() => navigate(`/medico/paciente/${alert.patientId}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className={cn(
                            "w-5 h-5 mt-0.5 shrink-0",
                            alert.severity === 'critical' ? 'text-destructive' :
                            alert.severity === 'warning' ? 'text-warning' : 'text-info'
                          )} />
                          <div>
                            {groupBy === 'severity' && (
                              <p className="text-sm text-muted-foreground mb-1">
                                {alert.patientName}
                              </p>
                            )}
                            <p className="text-foreground">{alert.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(alert.timestamp), "d 'de' MMMM 'a las' HH:mm", { locale: es })}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>

        {filteredAlerts.length === 0 && (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {showResolved 
                ? 'No hay alertas para mostrar.'
                : 'No hay alertas sin resolver.'
              }
            </p>
          </div>
        )}
      </div>
    </MedicoLayout>
  );
}
