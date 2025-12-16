import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Activity,
  Target,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AIReport, Patient } from '@/types/diabetes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ReportCardProps {
  report: AIReport;
  patient?: Patient;
}

export function ReportCard({ report, patient }: ReportCardProps) {
  const { summary, recommendations, generatedAt } = report;

  const getTrendIcon = () => {
    switch (summary.trend) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-success" />;
      case 'deteriorating':
        return <TrendingDown className="w-4 h-4 text-destructive" />;
      default:
        return <Minus className="w-4 h-4 text-warning" />;
    }
  };

  const getTrendLabel = () => {
    switch (summary.trend) {
      case 'improving':
        return 'Mejorando';
      case 'deteriorating':
        return 'Deteriorando';
      default:
        return 'Estable';
    }
  };

  const getTrendColor = () => {
    switch (summary.trend) {
      case 'improving':
        return 'bg-success/15 text-success border-success/30';
      case 'deteriorating':
        return 'bg-destructive/15 text-destructive border-destructive/30';
      default:
        return 'bg-warning/15 text-warning border-warning/30';
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            {patient && (
              <p className="text-sm text-muted-foreground mb-1">{patient.name}</p>
            )}
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Informe de Control
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {format(new Date(generatedAt), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
            </p>
          </div>
          <Badge variant="outline" className={cn("flex items-center gap-1", getTrendColor())}>
            {getTrendIcon()}
            {getTrendLabel()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-hig bg-secondary/30">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Promedio</span>
            </div>
            <p className="text-lg font-semibold text-foreground">{summary.avgGlucose} <span className="text-xs font-normal">mg/dL</span></p>
          </div>
          <div className="p-3 rounded-hig bg-secondary/30">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-success" />
              <span className="text-xs text-muted-foreground">En Rango</span>
            </div>
            <p className="text-lg font-semibold text-foreground">{summary.timeInRange}%</p>
          </div>
          <div className="p-3 rounded-hig bg-secondary/30">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-warning" />
              <span className="text-xs text-muted-foreground">Hiper</span>
            </div>
            <p className="text-lg font-semibold text-foreground">{summary.hyperCount}</p>
          </div>
          <div className="p-3 rounded-hig bg-secondary/30">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <span className="text-xs text-muted-foreground">Hipo</span>
            </div>
            <p className="text-lg font-semibold text-foreground">{summary.hypoCount}</p>
          </div>
        </div>

        {/* Recommendations */}
        <div>
          <h4 className="text-sm font-medium text-foreground mb-2">Recomendaciones</h4>
          <ul className="space-y-2">
            {recommendations.map((rec, index) => (
              <li 
                key={index}
                className="flex items-start gap-2 text-sm text-muted-foreground"
              >
                <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {index + 1}
                </span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
