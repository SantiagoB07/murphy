import { cn } from '@/app/lib/utils';
import { UserRole } from '@/app/types/diabetes';
import { useIsMobile } from '@/app/hooks/use-mobile';
import { MobileBottomNav } from '@/app/components/navigation/MobileBottomNav';
import { TopNavbar } from '@/app/components/navigation/TopNavbar';
import { Activity } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  userRole: UserRole;
  userName: string;
}

export function DashboardLayout({ children, userRole, userName }: DashboardLayoutProps) {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 glass-card border-b border-border/50 px-4 safe-area-inset">
        <div className="flex items-center justify-center h-full">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-hig bg-gradient-purple flex items-center justify-center">
              <Activity className="w-[var(--icon-md)] h-[var(--icon-md)] text-foreground" aria-hidden="true" />
            </div>
            <span className="font-semibold text-foreground">DiabetesManager</span>
          </div>
        </div>
      </header>

      {/* Desktop/Tablet Top Navbar */}
      <TopNavbar userName={userName} userRole={userRole} />

      {/* Main Content */}
      <main 
        className={cn(
          "min-h-screen pt-14",
          "transition-all duration-hig-slow ease-hig-out",
          isMobile && "pb-20"
        )}
        id="main-content"
      >
        <div className="p-4 lg:p-6 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      {isMobile && <MobileBottomNav userRole={userRole} />}
    </div>
  );
}
