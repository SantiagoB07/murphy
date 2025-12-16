import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Syringe, Calendar, Pill } from 'lucide-react';
import { InsulinSchedule } from '@/types/diabetes';

interface InsulinConfigCardProps {
  type: 'rapid' | 'basal';
  schedule: InsulinSchedule | null;
  onUpdate: () => void;
}

export function InsulinConfigCard({
  type,
  schedule,
  onUpdate,
}: InsulinConfigCardProps) {
  const title = type === 'rapid' ? 'Insulina Rápida' : 'Insulina Basal';
  const dailyTotal = schedule ? schedule.timesPerDay * schedule.unitsPerDose : 0;

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Syringe className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {schedule ? (
          <>
            {/* Current schedule info */}
            <div className="space-y-3">
              {/* Brand if available */}
              {schedule.brand && (
                <div className="flex items-center gap-2 text-sm">
                  <Pill className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{schedule.brand}</span>
                </div>
              )}

              {/* Dose info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Por aplicación</p>
                  <p className="text-xl font-bold">{schedule.unitsPerDose}U</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Frecuencia</p>
                  <p className="text-xl font-bold">{schedule.timesPerDay}x/día</p>
                </div>
              </div>

              {/* Daily total */}
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-sm text-muted-foreground">Total diario</p>
                <p className="text-2xl font-bold text-primary">
                  {dailyTotal} <span className="text-base font-normal">unidades</span>
                </p>
              </div>

              {/* Effective from */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Desde {format(new Date(schedule.effectiveFrom), 'dd MMM yyyy', { locale: es })}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <Syringe className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Sin configuración</p>
            <p className="text-xs">Configura tu dosis de {title.toLowerCase()}</p>
          </div>
        )}

        <Button onClick={onUpdate} className="w-full h-[44px]">
          {schedule ? 'Actualizar dosis' : 'Configurar dosis'}
        </Button>
      </CardContent>
    </Card>
  );
}
