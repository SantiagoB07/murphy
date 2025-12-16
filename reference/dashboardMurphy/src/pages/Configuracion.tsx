import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { User, Bell, Shield, Smartphone, ChevronRight, LogOut } from 'lucide-react';
import { UserRole } from '@/types/diabetes';
import { useAuth } from '@/contexts/AuthContext';
import { PersonalDataSheet } from '@/components/settings/PersonalDataSheet';
import { SecuritySheet } from '@/components/settings/SecuritySheet';
import { NotificationsSheet } from '@/components/settings/NotificationsSheet';
import { DevicesSheet } from '@/components/settings/DevicesSheet';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

type SettingsSection = 'personal' | 'security' | 'notifications' | 'devices';

const settingsItems = [
  { 
    key: 'personal' as SettingsSection, 
    icon: User, 
    label: 'Datos personales', 
    description: 'Nombre, email, fecha de nacimiento' 
  },
  { 
    key: 'security' as SettingsSection, 
    icon: Shield, 
    label: 'Seguridad', 
    description: 'Contraseña y autenticación' 
  },
  { 
    key: 'notifications' as SettingsSection, 
    icon: Bell, 
    label: 'Notificaciones', 
    description: 'Alertas y recordatorios' 
  },
  { 
    key: 'devices' as SettingsSection, 
    icon: Smartphone, 
    label: 'Dispositivos', 
    description: 'Glucómetros conectados' 
  },
];

export default function Configuracion() {
  const location = useLocation();
  const { userRole: authRole, profile, isDemoMode, demoRole, signOut, exitDemoMode } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Use auth role if available, fallback to location state for demo mode compatibility
  const userRole: UserRole = authRole || demoRole || (location.state?.role as UserRole) || 'patient';
  const userName = profile?.full_name || 'Usuario';
  
  const [openSheet, setOpenSheet] = useState<SettingsSection | null>(null);

  const handleOpenSheet = (section: SettingsSection) => {
    setOpenSheet(section);
  };

  const handleCloseSheet = () => {
    setOpenSheet(null);
  };

  const handleLogout = async () => {
    if (isDemoMode) {
      exitDemoMode();
      toast({
        title: 'Modo demo finalizado',
        description: 'Has salido del modo de prueba',
      });
    } else {
      await signOut();
      toast({
        title: 'Sesión cerrada',
        description: 'Has cerrado sesión correctamente',
      });
    }
    navigate('/');
  };

  return (
    <DashboardLayout userRole={userRole} userName={userName}>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configuración</h1>
          <p className="text-muted-foreground mt-1">Gestiona tu cuenta y preferencias</p>
        </div>

        {/* Demo Mode Banner */}
        {isDemoMode && (
          <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
            <p className="text-warning text-sm font-medium">
              Estás en modo demo. Los cambios no se guardarán.
            </p>
          </div>
        )}

        {/* General Settings */}
        <section className="space-y-4">
          <h2 className="font-semibold text-foreground">Ajustes generales</h2>
          <div className="grid gap-3">
            {settingsItems.map((item) => (
              <button
                key={item.key}
                onClick={() => handleOpenSheet(item.key)}
                className="glass-card p-4 flex items-center gap-4 text-left hover:bg-secondary/30 transition-colors group min-h-[56px]"
                aria-label={`Abrir ${item.label}`}
              >
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </button>
            ))}
          </div>
        </section>

        {/* Logout Section */}
        <section className="space-y-4">
          <h2 className="font-semibold text-foreground">Sesión</h2>
          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-auto py-4 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
            <span>{isDemoMode ? 'Salir del modo demo' : 'Cerrar sesión'}</span>
          </Button>
        </section>
      </div>

      {/* Sheets */}
      <PersonalDataSheet 
        open={openSheet === 'personal'} 
        onOpenChange={(open) => !open && handleCloseSheet()} 
      />
      <SecuritySheet 
        open={openSheet === 'security'} 
        onOpenChange={(open) => !open && handleCloseSheet()} 
      />
      <NotificationsSheet 
        open={openSheet === 'notifications'} 
        onOpenChange={(open) => !open && handleCloseSheet()} 
      />
      <DevicesSheet 
        open={openSheet === 'devices'} 
        onOpenChange={(open) => !open && handleCloseSheet()} 
      />
    </DashboardLayout>
  );
}
