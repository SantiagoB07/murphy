import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { User, Users } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { InsulinSchedule } from '@/types/diabetes';
import { calculateChange } from '@/hooks/useInsulinSchedule';

interface InsulinHistoryTableProps {
  history: InsulinSchedule[];
}

export function InsulinHistoryTable({ history }: InsulinHistoryTableProps) {
  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Sin historial de cambios</p>
      </div>
    );
  }

  // Group history by type to calculate changes
  const rapidHistory = history.filter(h => h.type === 'rapid');
  const basalHistory = history.filter(h => h.type === 'basal');

  // Calculate change for each record
  const enrichedHistory = history.map((record) => {
    const typeHistory = record.type === 'rapid' ? rapidHistory : basalHistory;
    const currentIndex = typeHistory.findIndex(h => h.id === record.id);
    const previousRecord = typeHistory[currentIndex + 1]; // History is sorted DESC
    
    return {
      ...record,
      doseChange: calculateChange(previousRecord?.unitsPerDose, record.unitsPerDose),
      freqChange: previousRecord 
        ? record.timesPerDay !== previousRecord.timesPerDay
          ? `${previousRecord.timesPerDay}→${record.timesPerDay}x/día`
          : `${record.timesPerDay}x/día`
        : `${record.timesPerDay}x/día`,
    };
  });

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30">
            <TableHead className="w-[100px]">Fecha</TableHead>
            <TableHead className="w-[80px]">Tipo</TableHead>
            <TableHead>Cambio</TableHead>
            <TableHead className="hidden md:table-cell">Motivo</TableHead>
            <TableHead className="w-[100px]">Por</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {enrichedHistory.map((record) => (
            <TableRow key={record.id}>
              <TableCell className="font-medium">
                {format(new Date(record.effectiveFrom), 'dd MMM yyyy', { locale: es })}
              </TableCell>
              <TableCell>
                <Badge 
                  variant={record.type === 'rapid' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {record.type === 'rapid' ? 'Rápida' : 'Basal'}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <p className="text-sm font-medium">{record.doseChange}</p>
                  <p className="text-xs text-muted-foreground">{record.freqChange}</p>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell max-w-[200px]">
                <p className="text-sm text-muted-foreground truncate">
                  {record.changeReason || '-'}
                </p>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5">
                  {record.changedByRole === 'coadmin' ? (
                    <Users className="h-4 w-4 text-purple-500" />
                  ) : (
                    <User className="h-4 w-4 text-blue-500" />
                  )}
                  <span className="text-xs text-muted-foreground">
                    {record.changedByRole === 'coadmin' ? 'Co-admin' : 'Paciente'}
                  </span>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
