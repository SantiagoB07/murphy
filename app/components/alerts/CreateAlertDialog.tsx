'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/app/components/ui/radio-group';
import { Bell, Phone, MessageCircle, Loader2 } from 'lucide-react';
import type { AlertType, AlertChannel } from '@/app/lib/services/alerts';

interface CreateAlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alertType: AlertType;
  onSubmit: (scheduledTime: string, channel: AlertChannel) => Promise<void>;
}

export function CreateAlertDialog({
  open,
  onOpenChange,
  alertType,
  onSubmit,
}: CreateAlertDialogProps) {
  const [time, setTime] = useState('08:00');
  const [channel, setChannel] = useState<AlertChannel>('whatsapp');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(time, channel);
      // Reset form
      setTime('08:00');
      setChannel('whatsapp');
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating alert:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = alertType === 'glucometry' ? 'glucometría' : 'insulina';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[360px] bg-card border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Bell className="w-5 h-5 text-primary" />
            Nueva alerta
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Crea un recordatorio para tu {title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Time picker */}
          <div className="space-y-2">
            <Label htmlFor="time" className="text-sm font-medium text-foreground">
              Hora
            </Label>
            <Input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="bg-muted/30 border-border/50"
            />
          </div>

          {/* Channel selector */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-foreground">
              Notificarme por
            </Label>
            <RadioGroup
              value={channel}
              onValueChange={(value) => setChannel(value as AlertChannel)}
              className="space-y-2"
            >
              <label
                htmlFor="channel-whatsapp"
                className="flex items-center gap-3 p-3 rounded-hig bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <RadioGroupItem value="whatsapp" id="channel-whatsapp" />
                <div className="w-10 h-10 rounded-hig bg-green-500/20 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="font-medium text-foreground">WhatsApp</p>
                  <p className="text-xs text-muted-foreground">Mensaje de texto</p>
                </div>
              </label>

              <label
                htmlFor="channel-call"
                className="flex items-center gap-3 p-3 rounded-hig bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <RadioGroupItem value="call" id="channel-call" />
                <div className="w-10 h-10 rounded-hig bg-blue-500/20 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Llamada</p>
                  <p className="text-xs text-muted-foreground">Llamada telefónica</p>
                </div>
              </label>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 sm:flex-none"
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex-1 sm:flex-none"
            disabled={isSubmitting || !time}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creando...
              </>
            ) : (
              'Crear alerta'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
