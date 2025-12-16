import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Plus, Trash2, RefreshCw, Battery, Bluetooth, AlertCircle } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ConnectedDevice } from '@/types/diabetes';

interface DevicesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const mockDevices: ConnectedDevice[] = [
  {
    id: 'd001',
    name: 'Glucómetro Principal',
    brand: 'Accu-Chek',
    model: 'Guide',
    connectedAt: '2024-10-15T10:30:00Z',
    lastSync: '2024-12-06T08:45:00Z',
    batteryLevel: 78,
  },
  {
    id: 'd002',
    name: 'Glucómetro Portátil',
    brand: 'FreeStyle',
    model: 'Libre 3',
    connectedAt: '2024-11-20T14:00:00Z',
    lastSync: '2024-12-05T19:30:00Z',
    batteryLevel: 45,
  },
];

export function DevicesSheet({ open, onOpenChange }: DevicesSheetProps) {
  const { toast } = useToast();
  const [devices, setDevices] = useState<ConnectedDevice[]>(mockDevices);
  const [deviceToDelete, setDeviceToDelete] = useState<string | null>(null);
  const [isConnectDialogOpen, setIsConnectDialogOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);

  const handleSync = async (deviceId: string) => {
    setIsSyncing(deviceId);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setDevices(prev =>
      prev.map(d =>
        d.id === deviceId
          ? { ...d, lastSync: new Date().toISOString() }
          : d
      )
    );
    setIsSyncing(null);
    
    toast({
      title: 'Sincronización completada',
      description: 'Los datos del dispositivo se han actualizado.',
    });
  };

  const handleDisconnect = (deviceId: string) => {
    setDevices(prev => prev.filter(d => d.id !== deviceId));
    setDeviceToDelete(null);
    
    toast({
      title: 'Dispositivo desconectado',
      description: 'El glucómetro ha sido removido de tu cuenta.',
    });
  };

  const handleConnectNew = () => {
    setIsConnectDialogOpen(false);
    toast({
      title: 'Búsqueda iniciada',
      description: 'Asegúrate de que tu glucómetro esté encendido y en modo emparejamiento.',
    });
  };

  const getBatteryColor = (level: number) => {
    if (level > 50) return 'text-green-500';
    if (level > 20) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Dispositivos</SheetTitle>
            <SheetDescription>
              Gestiona los glucómetros conectados a tu cuenta
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 mt-6">
            {devices.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  No tienes dispositivos conectados
                </p>
              </div>
            ) : (
              devices.map((device) => (
                <div
                  key={device.id}
                  className="p-4 rounded-xl border border-border bg-card"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium">{device.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {device.brand} {device.model}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Battery className={`w-4 h-4 ${getBatteryColor(device.batteryLevel || 0)}`} />
                      <span className="text-xs text-muted-foreground">
                        {device.batteryLevel}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                    <Bluetooth className="w-3 h-3" />
                    <span>
                      Última sincronización:{' '}
                      {device.lastSync
                        ? format(new Date(device.lastSync), "d MMM, HH:mm", { locale: es })
                        : 'Nunca'}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleSync(device.id)}
                      disabled={isSyncing === device.id}
                    >
                      <RefreshCw className={`w-4 h-4 mr-1 ${isSyncing === device.id ? 'animate-spin' : ''}`} />
                      {isSyncing === device.id ? 'Sincronizando...' : 'Sincronizar'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeviceToDelete(device.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}

            <Dialog open={isConnectDialogOpen} onOpenChange={setIsConnectDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Conectar nuevo dispositivo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Conectar glucómetro</DialogTitle>
                  <DialogDescription>
                    Sigue estos pasos para emparejar tu dispositivo
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                      1
                    </div>
                    <p className="text-sm">Enciende tu glucómetro y activa el modo Bluetooth</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                      2
                    </div>
                    <p className="text-sm">Activa el modo de emparejamiento en el dispositivo</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                      3
                    </div>
                    <p className="text-sm">Presiona "Buscar" y selecciona tu glucómetro de la lista</p>
                  </div>
                </div>
                <Button onClick={handleConnectNew} className="w-full">
                  <Bluetooth className="w-4 h-4 mr-2" />
                  Buscar dispositivos
                </Button>
              </DialogContent>
            </Dialog>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deviceToDelete} onOpenChange={() => setDeviceToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Desconectar dispositivo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción desvinculará el glucómetro de tu cuenta. Podrás volver a conectarlo en cualquier momento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deviceToDelete && handleDisconnect(deviceToDelete)}
            >
              Desconectar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
