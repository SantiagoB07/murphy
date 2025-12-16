import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { AICallScheduleManager } from '@/components/alerts/AICallScheduleManager';
import { Bell, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const mockAlerts = [
  { id: 1, type: 'warning', title: 'Glucosa alta detectada', time: 'Hace 2 horas', value: '185 mg/dL' },
  { id: 2, type: 'info', title: 'Recordatorio de medición', time: 'Hace 4 horas', value: 'Antes de almuerzo' },
  { id: 3, type: 'success', title: 'Meta semanal cumplida', time: 'Ayer', value: '85% en rango' },
];

export default function Alertas() {
  const { userRole, user, patientProfile, coadminProfile, profile } = useAuth();
  
  // Determine patientId based on role
  const patientId = userRole === 'coadmin' 
    ? coadminProfile?.patient_id 
    : patientProfile?.id;

  const userName = profile?.full_name || 'Usuario';
  const displayRole = userRole || 'patient';

  return (
    <DashboardLayout userRole={displayRole} userName={userName}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Alertas</h1>
            <p className="text-muted-foreground mt-1">Historial de notificaciones</p>
          </div>
          <button className="text-sm text-primary hover:underline">
            Marcar todas como leídas
          </button>
        </div>

        {/* AI Voice Assistant Section */}
        {patientId && user && (userRole === 'patient' || userRole === 'coadmin') && (
          <AICallScheduleManager
            patientId={patientId}
            userId={user.id}
            userRole={userRole}
          />
        )}
        
        {/* Alerts History */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Historial
          </h2>
          {mockAlerts.map((alert) => (
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
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}