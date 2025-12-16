import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { GlucoseSlotCard } from './GlucoseSlotCard';
import { DailyLogInputDialog } from '@/components/daily-log/DailyLogInputDialog';
import { Glucometry, GlucometryType, MEAL_TIME_SLOTS } from '@/types/diabetes';
import { Activity, History } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface GlucoseLogSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientName: string;
  todayRecords: Map<GlucometryType, Glucometry>;
  onAddRecord: (type: GlucometryType, value: number, notes?: string) => void;
  onUpdateRecord: (id: string, value: number, notes?: string) => void;
}

export function GlucoseLogSheet({
  open,
  onOpenChange,
  patientName,
  todayRecords,
  onAddRecord,
  onUpdateRecord,
}: GlucoseLogSheetProps) {
  const navigate = useNavigate();
  const [selectedSlot, setSelectedSlot] = useState<{
    type: GlucometryType;
    record?: Glucometry;
  } | null>(null);

  const today = format(new Date(), "EEEE, d 'de' MMMM", { locale: es });

  const handleSlotClick = (type: GlucometryType, record?: Glucometry) => {
    setSelectedSlot({ type, record });
  };

  const handleSaveRecord = (value: number, notes?: string) => {
    if (!selectedSlot) return;

    if (selectedSlot.record) {
      onUpdateRecord(selectedSlot.record.id, value, notes);
    } else {
      onAddRecord(selectedSlot.type, value, notes);
    }
    setSelectedSlot(null);
  };

  const handleViewHistory = () => {
    onOpenChange(false);
    navigate('/glucometrias');
  };

  // Count completed slots
  const completedCount = MEAL_TIME_SLOTS.filter(
    slot => todayRecords.has(slot.type)
  ).length;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent 
          side="bottom" 
          className="h-[85vh] rounded-t-[var(--radius-xl)] bg-card border-border/50 px-4 pb-8"
        >
          <SheetHeader className="text-left pb-4 pt-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-hig bg-primary/20 flex items-center justify-center">
                <Activity className="w-5 h-5 text-primary" aria-hidden="true" />
              </div>
              <div>
                <SheetTitle className="text-foreground text-hig-lg">
                  Control de Glucosa
                </SheetTitle>
                <p className="text-hig-xs text-muted-foreground capitalize">
                  {patientName} • {today}
                </p>
              </div>
            </div>
            
            {/* Progress indicator */}
            <div className="mt-4 flex items-center gap-3">
              <div className="flex-1 h-2 bg-muted/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${(completedCount / 6) * 100}%` }}
                />
              </div>
              <span className="text-hig-xs text-muted-foreground">
                {completedCount}/6 registros
              </span>
            </div>
          </SheetHeader>

          {/* Slots List */}
          <div 
            className="space-y-3 overflow-y-auto flex-1 pb-20"
            role="list"
            aria-label="Momentos del día para registro"
          >
            {MEAL_TIME_SLOTS.map((slot, index) => (
              <div 
                key={slot.type}
                className="animate-fade-up"
                style={{ animationDelay: `${index * 0.05}s` }}
                role="listitem"
              >
                <GlucoseSlotCard
                  type={slot.type}
                  record={todayRecords.get(slot.type)}
                  iconName={slot.icon}
                  onClick={() => handleSlotClick(slot.type, todayRecords.get(slot.type))}
                />
              </div>
            ))}
          </div>

          {/* Bottom Action */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-card via-card to-transparent pt-8">
            <Button
              variant="outline"
              onClick={handleViewHistory}
              className="w-full gap-2 h-12"
              aria-label="Ver historial completo de glucometrías"
            >
              <History className="w-4 h-4" aria-hidden="true" />
              Ver Historial Completo
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Input Dialog */}
      {selectedSlot && (
        <DailyLogInputDialog
          open={!!selectedSlot}
          onOpenChange={(open) => !open && setSelectedSlot(null)}
          type="glucose"
          glucometryType={selectedSlot.type}
          initialValue={selectedSlot.record?.value}
          onSave={handleSaveRecord}
        />
      )}
    </>
  );
}
