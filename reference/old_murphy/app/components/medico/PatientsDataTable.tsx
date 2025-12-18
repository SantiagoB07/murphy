"use client";

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowUpDown, 
  TrendingUp, 
  Eye,
  FileText
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { Patient, getGlucoseStatus, GLUCOSE_RANGES } from '@/app/types/diabetes';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { Badge } from '@/app/components/ui/badge';

interface PatientsDataTableProps {
  patients: Patient[];
}

type SortKey = 'name' | 'diabetesType' | 'lastGlucose' | 'timeInRange';
type SortDirection = 'asc' | 'desc';

export function PatientsDataTable({ patients }: PatientsDataTableProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [diabetesFilter, setDiabetesFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Calculate derived data for each patient
  const patientsWithStats = useMemo(() => {
    return patients.map(patient => {
      const lastGlucose = patient.glucometrias.length > 0
        ? patient.glucometrias.sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )[0]
        : null;
      
      // Calculate time in range (70-180 mg/dL)
      const inRangeCount = patient.glucometrias.filter(
        g => g.value >= GLUCOSE_RANGES.low && g.value <= GLUCOSE_RANGES.high
      ).length;
      const timeInRange = patient.glucometrias.length > 0
        ? Math.round((inRangeCount / patient.glucometrias.length) * 100)
        : 0;

      return {
        ...patient,
        lastGlucose,
        timeInRange,
      };
    });
  }, [patients]);

  // Filter and sort
  const filteredPatients = useMemo(() => {
    let result = patientsWithStats;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(query)
      );
    }

    // Diabetes type filter
    if (diabetesFilter !== 'all') {
      result = result.filter(p => p.diabetesType === diabetesFilter);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortKey) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'diabetesType':
          comparison = a.diabetesType.localeCompare(b.diabetesType);
          break;
        case 'lastGlucose':
          comparison = (a.lastGlucose?.value || 0) - (b.lastGlucose?.value || 0);
          break;
        case 'timeInRange':
          comparison = a.timeInRange - b.timeInRange;
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [patientsWithStats, searchQuery, diabetesFilter, sortKey, sortDirection]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const getGlucoseColor = (value: number) => {
    const status = getGlucoseStatus(value);
    switch (status) {
      case 'critical_low':
      case 'critical_high':
        return 'text-destructive';
      case 'low':
      case 'high':
        return 'text-warning';
      default:
        return 'text-success';
    }
  };

  const diabetesTypes = [...new Set(patients.map(p => p.diabetesType))];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Buscar por nombre..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={diabetesFilter} onValueChange={setDiabetesFilter}>
          <SelectTrigger className="sm:w-[180px]">
            <SelectValue placeholder="Tipo de diabetes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {diabetesTypes.map(type => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-hig border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/30">
              <TableHead>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleSort('name')}
                  className="h-8 px-2 -ml-2"
                >
                  Paciente
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleSort('diabetesType')}
                  className="h-8 px-2 -ml-2"
                >
                  Tipo
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleSort('lastGlucose')}
                  className="h-8 px-2 -ml-2"
                >
                  Última Glucosa
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="hidden md:table-cell">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleSort('timeInRange')}
                  className="h-8 px-2 -ml-2"
                >
                  En Rango
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPatients.map((patient) => (
              <TableRow 
                key={patient.id}
                className="cursor-pointer transition-colors hover:bg-secondary/20"
                onClick={() => router.push(`/medico/paciente/${patient.id}`)}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-purple flex items-center justify-center shrink-0">
                      <span className="text-sm font-medium text-foreground">
                        {patient.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{patient.name}</p>
                      <p className="text-xs text-muted-foreground">{patient.age} años</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {patient.diabetesType}
                  </Badge>
                </TableCell>
                <TableCell>
                  {patient.lastGlucose ? (
                    <span className={cn("font-medium", getGlucoseColor(patient.lastGlucose.value))}>
                      {patient.lastGlucose.value} mg/dL
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-sm">Sin datos</span>
                  )}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="flex items-center gap-2">
                    <TrendingUp className={cn(
                      "w-4 h-4",
                      patient.timeInRange >= 70 ? "text-success" :
                      patient.timeInRange >= 50 ? "text-warning" : "text-destructive"
                    )} />
                    <span className={cn(
                      "font-medium",
                      patient.timeInRange >= 70 ? "text-success" :
                      patient.timeInRange >= 50 ? "text-warning" : "text-destructive"
                    )}>
                      {patient.timeInRange}%
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/medico/paciente/${patient.id}`)}
                      className="h-8 w-8 p-0"
                      aria-label="Ver dashboard"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push(`/medico/informes?patient=${patient.id}`)}
                      className="h-8 w-8 p-0"
                      aria-label="Generar informe"
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredPatients.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No se encontraron pacientes con los filtros aplicados.
        </div>
      )}
    </div>
  );
}
