import { useEffect, useState } from 'react';
import { Zap, TrendingUp, Award, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface XPDonutProps {
  totalXP: number;
  todayXP: number;
  currentLevelXP: number;
  nextLevelThreshold: number;
  streak: number;
  levelTitle: string;
  streakMultiplier: number;
  slotsToday: number;
  progressPercent: number;
  animate?: boolean;
}

export function XPDonut({ 
  totalXP,
  todayXP,
  currentLevelXP,
  nextLevelThreshold,
  streak,
  levelTitle,
  streakMultiplier,
  slotsToday,
  progressPercent,
  animate = true,
}: XPDonutProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [animatedTodayXP, setAnimatedTodayXP] = useState(0);
  
  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDashoffset = circumference - (animatedProgress / 100) * circumference;

  useEffect(() => {
    if (animate) {
      const timer = setTimeout(() => {
        setAnimatedProgress(progressPercent);
      }, 200);
      return () => clearTimeout(timer);
    } else {
      setAnimatedProgress(progressPercent);
    }
  }, [progressPercent, animate]);

  useEffect(() => {
    if (animate && todayXP > 0) {
      // Animate counting up
      const duration = 800;
      const steps = 20;
      const increment = todayXP / steps;
      let current = 0;
      
      const timer = setInterval(() => {
        current += increment;
        if (current >= todayXP) {
          setAnimatedTodayXP(todayXP);
          clearInterval(timer);
        } else {
          setAnimatedTodayXP(Math.round(current));
        }
      }, duration / steps);
      
      return () => clearInterval(timer);
    } else {
      setAnimatedTodayXP(todayXP);
    }
  }, [todayXP, animate]);

  return (
    <section 
      className="glass-card p-6 animate-fade-up"
      aria-labelledby="xp-donut-title"
    >
      <div className="flex flex-col items-center gap-6">
        {/* Donut Chart */}
        <div 
          className="relative"
          role="img"
          aria-label={`Nivel XP: ${animatedProgress.toFixed(0)}%`}
        >
          <svg 
            className="w-28 h-28 md:w-32 md:h-32 lg:w-36 lg:h-36 transform -rotate-90"
            viewBox="0 0 100 100"
            aria-hidden="true"
          >
            {/* Background Circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="8"
            />
            
            {/* Progress Circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="url(#purpleGradient)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-hig-slower ease-hig-out"
              style={{
                filter: 'drop-shadow(0 0 4px hsl(273 100% 71% / 0.3))'
              }}
            />

            {/* Gradient Definition */}
            <defs>
              <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(265, 100%, 60%)" />
                <stop offset="50%" stopColor="hsl(273, 100%, 71%)" />
                <stop offset="100%" stopColor="hsl(280, 100%, 77%)" />
              </linearGradient>
            </defs>
          </svg>

          {/* Center Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Zap className="w-[var(--icon-lg)] h-[var(--icon-lg)] text-purple-400 mb-1" aria-hidden="true" />
            <span className="text-hig-3xl font-bold text-foreground leading-hig-tight">
              {animatedProgress.toFixed(0)}%
            </span>
            <span className="text-hig-xs text-muted-foreground">Nivel</span>
          </div>
        </div>

        {/* Stats - centered with max width */}
        <div className="w-full max-w-xs space-y-4 text-center">
          <div>
            <h3 id="xp-donut-title" className="font-semibold text-hig-lg text-foreground mb-1 leading-hig-tight">
              {levelTitle}
            </h3>
            <p className="text-hig-sm text-muted-foreground leading-hig-normal">
              ¡Continúa así para subir de nivel!
            </p>
          </div>

          {/* Today's XP */}
          <div className="p-3 rounded-hig bg-purple-500/10 border border-purple-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-purple-400" />
                <span className="text-hig-sm text-muted-foreground">XP de hoy</span>
              </div>
              <span className="text-hig-xl font-bold text-purple-400">+{animatedTodayXP}</span>
            </div>
            {streakMultiplier > 1 && (
              <p className="text-hig-xs text-muted-foreground mt-1">
                Multiplicador ×{streakMultiplier.toFixed(2)} activo
              </p>
            )}
          </div>

          {/* XP Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-hig-sm">
              <span className="text-muted-foreground">Progreso XP</span>
              <span className="text-foreground font-medium">{currentLevelXP} / {nextLevelThreshold}</span>
            </div>
            <div 
              className="h-1.5 bg-muted rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={currentLevelXP}
              aria-valuemin={0}
              aria-valuemax={nextLevelThreshold}
              aria-label="Progreso hacia siguiente nivel"
            >
              <div 
                className="h-full bg-gradient-purple rounded-full transition-all duration-hig-slower ease-hig-out"
                style={{ width: `${(currentLevelXP / nextLevelThreshold) * 100}%` }}
              />
            </div>
          </div>

          {/* Streak & Slots Today */}
          <div className="grid grid-cols-2 gap-3" role="list" aria-label="Estadísticas">
            <div className="bg-secondary/30 p-3 rounded-hig" role="listitem">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-hig bg-warning/20 flex items-center justify-center">
                  <Flame className="w-4 h-4 text-warning" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-hig-xs text-muted-foreground">Racha</p>
                  <p className="font-semibold text-foreground text-hig-sm">{streak} días</p>
                </div>
              </div>
            </div>

            <div className="bg-secondary/30 p-3 rounded-hig" role="listitem">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-hig bg-success/20 flex items-center justify-center">
                  <Award className="w-[var(--icon-sm)] h-[var(--icon-sm)] text-success" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-hig-xs text-muted-foreground">Slots hoy</p>
                  <p className="font-semibold text-foreground text-hig-sm">{slotsToday}/6</p>
                </div>
              </div>
            </div>
          </div>

          {/* Next Reward */}
          <div className="flex items-center gap-3 p-3 rounded-hig bg-purple-500/10 border border-purple-500/20">
            <TrendingUp className="w-[var(--icon-md)] h-[var(--icon-md)] text-purple-400 shrink-0" aria-hidden="true" />
            <div className="flex-1">
              <p className="text-hig-sm font-medium text-foreground">Próxima recompensa</p>
              <p className="text-hig-xs text-muted-foreground">
                {totalXP < 300 
                  ? `Alcanza 300 XP para "En Progreso"`
                  : totalXP < 600 
                    ? `Alcanza 600 XP para "Aprendiz Avanzado"`
                    : totalXP < 900
                      ? `Alcanza 900 XP para "Experto en Glucemia"`
                      : totalXP < 1200
                        ? `Alcanza 1200 XP para "Maestro del Control"`
                        : "¡Nivel máximo alcanzado!"
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
