import { Link, useLocation } from 'react-router-dom';
import { 
  Settings, 
  UserCircle,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserRole } from '@/types/diabetes';
import { getNavItems, getHomeRoute, getSettingsRoute } from '@/lib/navigation';

interface TopNavbarProps {
  userName: string;
  userRole: UserRole;
}

const roleLabels: Record<UserRole, string> = {
  patient: 'Paciente',
  coadmin: 'Co-admin',
  doctor: 'Médico',
};

export function TopNavbar({ userName, userRole }: TopNavbarProps) {
  const location = useLocation();
  const navItems = getNavItems(userRole);
  const homeRoute = getHomeRoute(userRole);
  const settingsRoute = getSettingsRoute(userRole);
  
  const isActive = (path: string) => location.pathname === path;

  return (
    <header 
      className="hidden md:flex fixed top-0 left-0 right-0 z-50 h-14 bg-background/95 backdrop-blur-lg border-b border-border/50"
      role="banner"
    >
      <div className="w-full max-w-7xl mx-auto px-4 lg:px-6 flex items-center justify-between">
        {/* Logo */}
        <Link to={homeRoute} className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-hig bg-gradient-purple flex items-center justify-center">
            <Activity className="w-[var(--icon-md)] h-[var(--icon-md)] text-foreground" aria-hidden="true" />
          </div>
          <span className="font-semibold text-foreground text-hig-base">Murphy</span>
        </Link>

        {/* Navigation */}
        <nav 
          className="flex items-center gap-1"
          role="navigation"
          aria-label="Navegación principal"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <Link
                key={item.href}
                to={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-hig",
                  "transition-colors duration-hig-fast ease-hig-out",
                  "focus-ring min-h-[var(--touch-target-min)]",
                  active 
                    ? "bg-primary/15 text-foreground" 
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                <Icon className={cn(
                  "w-[var(--icon-sm)] h-[var(--icon-sm)]",
                  active && "text-primary"
                )} />
                <span className={cn(
                  "text-hig-sm font-medium",
                  active && "text-foreground"
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* User & Settings */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Settings Button */}
          <Link
            to={settingsRoute}
            aria-label="Configuración"
            className={cn(
              "flex items-center justify-center w-11 h-11 rounded-hig",
              "transition-colors duration-hig-fast",
              "focus-ring",
              isActive(settingsRoute)
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            )}
          >
            <Settings className="w-[var(--icon-md)] h-[var(--icon-md)]" />
          </Link>

          {/* User Info */}
          <div className="flex items-center gap-2 pl-3 border-l border-border/50">
            <div className="w-8 h-8 rounded-full bg-gradient-purple flex items-center justify-center">
              <UserCircle className="w-5 h-5 text-foreground" />
            </div>
            <div className="hidden lg:block">
              <p className="text-hig-sm font-medium text-foreground leading-tight">{userName}</p>
              <p className="text-hig-xs text-muted-foreground">{roleLabels[userRole]}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
