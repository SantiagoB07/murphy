import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Syringe, Check } from 'lucide-react';
import { toast } from 'sonner';
import { InsulinSchedule } from '@/app/types/diabetes';

interface InsulinConfigCardProps {
  type: 'rapid' | 'basal';
  title: string;
  maxFrequency: number;
  schedule: InsulinSchedule | null;
  onSave: (schedule: InsulinSchedule) => void;
}

export function InsulinConfigCard({
  type,
  title,
  maxFrequency,
  schedule,
  onSave
}: InsulinConfigCardProps) {
  const [timesPerDay, setTimesPerDay] = useState(schedule?.timesPerDay ?? 1);
  const [unitsPerDose, setUnitsPerDose] = useState(schedule?.unitsPerDose ?? 0);
  const [isSaved, setIsSaved] = useState(false);

  const dailyTotal = timesPerDay * unitsPerDose;

  const handleSave = () => {
    if (unitsPerDose <= 0) {
      toast.error('Ingresa una dosis válida');
      return;
    }
    
    onSave({
      type,
      timesPerDay,
      unitsPerDose
    });
    
    setIsSaved(true);
    toast.success(`Configuración de ${title} guardada`);
    
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Syringe className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Frequency selector */}
        <div className="space-y-3">
          <Label className="text-sm text-muted-foreground">
            Frecuencia diaria
          </Label>
          <div className="flex gap-2 flex-wrap">
            {Array.from({ length: maxFrequency }, (_, i) => i + 1).map((num) => (
              <Button
                key={num}
                type="button"
                variant={timesPerDay === num ? 'default' : 'outline'}
                size="sm"
                className="min-w-[44px] h-[44px]"
                onClick={() => setTimesPerDay(num)}
                aria-label={`${num} ${num === 1 ? 'vez' : 'veces'} al día`}
              >
                {num}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {timesPerDay === 1 ? '1 vez al día' : `${timesPerDay} veces al día`}
          </p>
        </div>

        {/* Units per dose */}
        <div className="space-y-3">
          <Label htmlFor={`${type}-units`} className="text-sm text-muted-foreground">
            Unidades por aplicación
          </Label>
          <div className="flex items-center gap-3">
            <Input
              id={`${type}-units`}
              type="number"
              min={1}
              max={100}
              value={unitsPerDose || ''}
              onChange={(e) => setUnitsPerDose(Number(e.target.value))}
              className="w-24 text-center text-lg font-medium"
              placeholder="0"
            />
            <span className="text-muted-foreground">U</span>
          </div>
        </div>

        {/* Daily total */}
        {unitsPerDose > 0 && (
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-sm text-muted-foreground">Total diario estimado</p>
            <p className="text-2xl font-bold text-primary">
              {dailyTotal} <span className="text-base font-normal">unidades</span>
            </p>
          </div>
        )}

        {/* Save button */}
        <Button
          onClick={handleSave}
          className="w-full h-[44px]"
          disabled={unitsPerDose <= 0}
        >
          {isSaved ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Guardado
            </>
          ) : (
            'Guardar configuración'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
