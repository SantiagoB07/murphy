import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/diabetes';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  allowDemo?: boolean;
}

export const ProtectedRoute = ({ 
  children, 
  allowedRoles,
  allowDemo = true 
}: ProtectedRouteProps) => {
  const { session, userRole, isLoading, isDemoMode, demoRole } = useAuth();
  const location = useLocation();

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  // Check if user has access
  const hasSession = !!session;
  const isInDemoMode = isDemoMode && allowDemo;
  const hasAccess = hasSession || isInDemoMode;

  if (!hasAccess) {
    // Redirect to auth page, saving the intended destination
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Check role restrictions if specified
  if (allowedRoles && allowedRoles.length > 0) {
    const currentRole = isDemoMode ? demoRole : userRole;
    if (currentRole && !allowedRoles.includes(currentRole)) {
      // Redirect to appropriate dashboard based on role
      const redirectPath = currentRole === 'doctor' ? '/medico/pacientes' : '/dashboard';
      return <Navigate to={redirectPath} replace />;
    }
  }

  return <>{children}</>;
};
