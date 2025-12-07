import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Slider } from '@/app/components/ui/slider';
import { Switch } from '@/app/components/ui/switch';
import { cn } from '@/app/lib/utils';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Droplets, 
  Syringe, 
  Moon, 
  Brain,
  Sparkles
} from 'lucide-react';
import { 
  GlucometryType, 
  GLUCOMETRY_LABELS, 
  getGlucoseStatus, 
  GLUCOSE_RANGES
} from '@/app/types/diabetes';

// ==================== TYPES ====================

export type DailyLogType = 'glucose' | 'insulin' | 'sleep' | 'stress' | 'dizziness';
export type InsulinVariant = 'rapid' | 'basal';

interface BaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface GlucoseDialogProps extends BaseDialogProps {
  type: 'glucose';
  glucometryType: GlucometryType;
  initialValue?: number;
  onSave: (value: number, notes?: string) => void;
}

interface InsulinDialogProps extends BaseDialogProps {
  type: 'insulin';
  variant: InsulinVariant;
  initialValue?: number;
  onSave: (units: number, notes?: string) => void;
}

interface SleepDialogProps extends BaseDialogProps {
  type: 'sleep';
  initialHours?: number;
  onSave: (hours: number) => void;
}

interface StressDialogProps extends BaseDialogProps {
  type: 'stress';
  initialValue?: boolean;
  onSave: (hasStress: boolean) => void;
}

interface DizzinessDialogProps extends BaseDialogProps {
  type: 'dizziness';
  initialValue?: boolean;
  onSave: (hasDizziness: boolean) => void;
}

export type DailyLogInputDialogProps = 
  | GlucoseDialogProps 
  | InsulinDialogProps 
  | SleepDialogProps 
  | StressDialogProps
  | DizzinessDialogProps;

// ==================== CONSTANTS ====================

const INSULIN_LABELS: Record<InsulinVariant, string> = {
  rapid: 'Insulina Rápida',
  basal: 'Insulina Basal',
};

const DIALOG_CONFIG = {
  glucose: { icon: Droplets, color: 'text-primary' },
  insulin: { icon: Syringe, color: 'text-blue-400' },
  sleep: { icon: Moon, color: 'text-indigo-400' },
  stress: { icon: Brain, color: 'text-rose-400' },
  dizziness: { icon: Sparkles, color: 'text-pink-400' },
};

// ==================== COMPONENT ====================

export function DailyLogInputDialog(props: DailyLogInputDialogProps) {
  // Render the appropriate variant based on type
  switch (props.type) {
    case 'glucose':
      return <GlucoseContent {...props} />;
    case 'insulin':
      return <InsulinContent {...props} />;
    case 'sleep':
      return <SleepContent {...props} />;
    case 'stress':
      return <StressContent {...props} />;
    case 'dizziness':
      return <DizzinessContent {...props} />;
  }
}

// ==================== GLUCOSE VARIANT ====================

function GlucoseContent({ open, onOpenChange, glucometryType, initialValue, onSave }: GlucoseDialogProps) {
  const [value, setValue] = useState<string>(initialValue?.toString() || '');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setValue(initialValue?.toString() || '');
      setNotes('');
      setError(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, initialValue]);

  const numericValue = parseInt(value, 10);
  const isValid = !isNaN(numericValue) && numericValue >= 20 && numericValue <= 600;
  const status = isValid ? getGlucoseStatus(numericValue) : null;

  const handleSubmit = () => {
    if (!value.trim()) {
      setError('Ingresa un valor');
      return;
    }
    if (!isValid) {
      setError('El valor debe estar entre 20 y 600 mg/dL');
      return;
    }
    onSave(numericValue, notes.trim() || undefined);
    onOpenChange(false);
  };

  const statusColors = {
    critical_low: 'text-destructive border-destructive/50',
    low: 'text-warning border-warning/50',
    normal: 'text-success border-success/50',
    high: 'text-warning border-warning/50',
    critical_high: 'text-destructive border-destructive/50',
  };

  const statusMessages = {
    critical_low: 'Hipoglucemia severa - Busca atención',
    low: 'Glucosa baja',
    normal: 'En rango normal',
    high: 'Glucosa elevada',
    critical_high: 'Hiperglucemia severa',
  };

  const Icon = DIALOG_CONFIG.glucose.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[360px] bg-card border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Icon className={cn("w-5 h-5", DIALOG_CONFIG.glucose.color)} />
            {GLUCOMETRY_LABELS[glucometryType]}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="glucose-value" className="text-muted-foreground">
              Valor de glucosa
            </Label>
            <div className="relative">
              <Input
                ref={inputRef}
                id="glucose-value"
                type="number"
                inputMode="numeric"
                placeholder="120"
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  setError(null);
                }}
                className={cn(
                  "text-2xl font-bold text-center h-16 pr-16",
                  isValid && status ? statusColors[status] : "",
                  error ? "border-destructive" : ""
                )}
                min={20}
                max={600}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                mg/dL
              </span>
            </div>
            
            {isValid && status && (
              <div className={cn(
                "flex items-center gap-2 p-2 rounded-lg",
                status === 'normal' ? "bg-success/10" : "bg-warning/10"
              )}>
                {status === 'normal' ? (
                  <CheckCircle2 className="w-4 h-4 text-success" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-warning" />
                )}
                <span className={cn(
                  "text-xs",
                  status === 'normal' ? "text-success" : "text-warning"
                )}>
                  {statusMessages[status]}
                </span>
              </div>
            )}

            {error && (
              <p className="text-xs text-destructive" role="alert">{error}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="glucose-notes" className="text-muted-foreground">
              Notas (opcional)
            </Label>
            <Textarea
              id="glucose-notes"
              placeholder="Ej: Después de ejercicio..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none h-20"
              maxLength={200}
            />
          </div>

          <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t border-border/30">
            <p>Rangos de referencia:</p>
            <ul className="grid grid-cols-2 gap-1">
              <li className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-warning" />
                <span>&lt;{GLUCOSE_RANGES.low} Bajo</span>
              </li>
              <li className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-success" />
                <span>{GLUCOSE_RANGES.low}-{GLUCOSE_RANGES.high} Normal</span>
              </li>
            </ul>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 sm:flex-none">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!value.trim()} className="flex-1 sm:flex-none">
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==================== INSULIN VARIANT ====================

function InsulinContent({ open, onOpenChange, variant, initialValue, onSave }: InsulinDialogProps) {
  const [value, setValue] = useState<string>(initialValue?.toString() || '');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setValue(initialValue?.toString() || '');
      setNotes('');
      setError(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, initialValue]);

  const numericValue = parseFloat(value);
  const isValid = !isNaN(numericValue) && numericValue > 0 && numericValue <= 100;

  const handleSubmit = () => {
    if (!value.trim()) {
      setError('Ingresa las unidades');
      return;
    }
    if (!isValid) {
      setError('El valor debe estar entre 0.5 y 100 unidades');
      return;
    }
    onSave(numericValue, notes.trim() || undefined);
    onOpenChange(false);
  };

  const Icon = DIALOG_CONFIG.insulin.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[360px] bg-card border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Icon className={cn("w-5 h-5", DIALOG_CONFIG.insulin.color)} />
            {INSULIN_LABELS[variant]}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="insulin-value" className="text-muted-foreground">
              Unidades aplicadas
            </Label>
            <div className="relative">
              <Input
                ref={inputRef}
                id="insulin-value"
                type="number"
                inputMode="decimal"
                step="0.5"
                placeholder="10"
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  setError(null);
                }}
                className={cn(
                  "text-2xl font-bold text-center h-16 pr-12",
                  error ? "border-destructive" : ""
                )}
                min={0.5}
                max={100}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                U
              </span>
            </div>

            {error && (
              <p className="text-xs text-destructive" role="alert">{error}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="insulin-notes" className="text-muted-foreground">
              Notas (opcional)
            </Label>
            <Textarea
              id="insulin-notes"
              placeholder="Ej: Dosis ajustada por médico..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none h-20"
              maxLength={200}
            />
          </div>

          <div className="text-xs text-muted-foreground pt-2 border-t border-border/30">
            <p className="flex items-center gap-1">
              <Syringe className="w-3 h-3" />
              {variant === 'rapid' 
                ? 'Insulina de acción rápida para las comidas' 
                : 'Insulina de acción prolongada (1-2 veces/día)'}
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 sm:flex-none">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!value.trim()} className="flex-1 sm:flex-none">
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==================== SLEEP VARIANT (simplified - only hours) ====================

function SleepContent({ open, onOpenChange, initialHours, onSave }: SleepDialogProps) {
  const [hours, setHours] = useState<number>(initialHours ?? 7);

  useEffect(() => {
    if (open) {
      setHours(initialHours ?? 7);
    }
  }, [open, initialHours]);

  const handleSubmit = () => {
    onSave(hours);
    onOpenChange(false);
  };

  const Icon = DIALOG_CONFIG.sleep.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[360px] bg-card border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Icon className={cn("w-5 h-5", DIALOG_CONFIG.sleep.color)} />
            Registro de Sueño
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Hours slider */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-muted-foreground">Horas dormidas</Label>
              <span className="text-2xl font-bold text-foreground">{hours}h</span>
            </div>
            <Slider
              value={[hours]}
              onValueChange={([v]) => setHours(v)}
              min={0}
              max={12}
              step={0.5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0h</span>
              <span>6h</span>
              <span>12h</span>
            </div>
          </div>

          <div className="text-xs text-muted-foreground pt-2 border-t border-border/30">
            <p>💡 Dormir 7-9 horas ayuda a regular la glucosa</p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 sm:flex-none">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} className="flex-1 sm:flex-none">
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==================== STRESS VARIANT (simplified - boolean switch) ====================

function StressContent({ open, onOpenChange, initialValue, onSave }: StressDialogProps) {
  const [hasStress, setHasStress] = useState<boolean>(initialValue ?? false);

  useEffect(() => {
    if (open) {
      setHasStress(initialValue ?? false);
    }
  }, [open, initialValue]);

  const handleSubmit = () => {
    onSave(hasStress);
    onOpenChange(false);
  };

  const Icon = DIALOG_CONFIG.stress.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[360px] bg-card border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Icon className={cn("w-5 h-5", DIALOG_CONFIG.stress.color)} />
            Registro de Estrés
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between p-4 rounded-hig bg-secondary/30">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-12 h-12 rounded-hig flex items-center justify-center",
                hasStress ? "bg-rose-500/20" : "bg-success/20"
              )}>
                <span className="text-2xl">{hasStress ? '😰' : '😌'}</span>
              </div>
              <div>
                <p className="font-medium text-foreground">
                  ¿Te sientes estresado hoy?
                </p>
                <p className="text-sm text-muted-foreground">
                  {hasStress ? 'Sí, tengo estrés' : 'No, estoy bien'}
                </p>
              </div>
            </div>
            <Switch
              checked={hasStress}
              onCheckedChange={setHasStress}
            />
          </div>

          <div className="text-xs text-muted-foreground pt-2 border-t border-border/30">
            <p>⚠️ El estrés elevado puede aumentar la glucosa</p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 sm:flex-none">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} className="flex-1 sm:flex-none">
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==================== DIZZINESS VARIANT (simplified - boolean switch) ====================

function DizzinessContent({ open, onOpenChange, initialValue, onSave }: DizzinessDialogProps) {
  const [hasDizziness, setHasDizziness] = useState<boolean>(initialValue ?? false);

  useEffect(() => {
    if (open) {
      setHasDizziness(initialValue ?? false);
    }
  }, [open, initialValue]);

  const handleSubmit = () => {
    onSave(hasDizziness);
    onOpenChange(false);
  };

  const Icon = DIALOG_CONFIG.dizziness.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[360px] bg-card border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Icon className={cn("w-5 h-5", DIALOG_CONFIG.dizziness.color)} />
            Registro de Mareos
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between p-4 rounded-hig bg-secondary/30">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-12 h-12 rounded-hig flex items-center justify-center",
                hasDizziness ? "bg-pink-500/20" : "bg-success/20"
              )}>
                <span className="text-2xl">{hasDizziness ? '😵‍💫' : '✨'}</span>
              </div>
              <div>
                <p className="font-medium text-foreground">
                  ¿Has tenido mareos hoy?
                </p>
                <p className="text-sm text-muted-foreground">
                  {hasDizziness ? 'Sí, he tenido mareos' : 'No, sin mareos'}
                </p>
              </div>
            </div>
            <Switch
              checked={hasDizziness}
              onCheckedChange={setHasDizziness}
            />
          </div>

          <div className="text-xs text-muted-foreground pt-2 border-t border-border/30">
            <p>💡 Los mareos pueden indicar cambios en glucosa</p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 sm:flex-none">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} className="flex-1 sm:flex-none">
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
