import { useNavigate } from 'react-router-dom';
import { Activity, ArrowRight, Zap, Shield, UserPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { getHomeRoute } from '@/lib/navigation';

const Index = () => {
  const navigate = useNavigate();
  const { session, userRole, isLoading } = useAuth();

  // Redirect authenticated users to their dashboard
  useEffect(() => {
    if (!isLoading && session && userRole) {
      const targetPath = getHomeRoute(userRole);
      navigate(targetPath, { replace: true });
    }
  }, [session, userRole, isLoading, navigate]);

  const handleLogin = () => {
    navigate('/auth?mode=login');
  };

  const handleCreateAccount = () => {
    navigate('/auth?mode=register');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Activity className="h-8 w-8 animate-pulse text-primary" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col safe-area-inset">
      {/* Hero Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-600/15 rounded-full blur-[80px]" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-500/10 rounded-full blur-[80px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-700/8 rounded-full blur-[60px]" />
      </div>

      {/* Skip link for accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-hig"
      >
        Saltar al contenido principal
      </a>

      {/* Header */}
      <header className="relative z-10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-hig bg-gradient-purple flex items-center justify-center elevation-1">
              <Activity className="w-[var(--icon-lg)] h-[var(--icon-lg)] text-foreground" aria-hidden="true" />
            </div>
            <div>
              <h1 className="font-bold text-hig-lg text-foreground leading-hig-tight">Murphy</h1>
              <span className="text-hig-xs text-muted-foreground">Dashboard de Diabetes</span>
            </div>
          </div>
          
          <button
            onClick={handleLogin}
            className="text-hig-sm text-primary hover:text-primary/80 transition-colors font-medium"
          >
            Iniciar sesión
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-4xl mx-auto text-center">
          {/* Title */}
          <h2 className="text-hig-3xl md:text-[clamp(2.5rem,5vw,4rem)] font-bold text-foreground mb-4 animate-fade-up leading-hig-tight">
            Tu salud,{' '}
            <span className="bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600 bg-clip-text text-transparent">
              bajo control
            </span>
          </h2>
          
          <p className="text-hig-lg md:text-hig-xl text-muted-foreground max-w-2xl mx-auto mb-8 animate-fade-up stagger-1 leading-hig-normal">
            Plataforma inteligente para el seguimiento de diabetes con análisis personalizado.
          </p>

          {/* Features */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-12 animate-fade-up stagger-2" role="list" aria-label="Características">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border/50" role="listitem">
              <Zap className="w-[var(--icon-sm)] h-[var(--icon-sm)] text-warning" aria-hidden="true" />
              <span className="text-hig-sm text-muted-foreground">Tiempo real</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border/50" role="listitem">
              <Shield className="w-[var(--icon-sm)] h-[var(--icon-sm)] text-success" aria-hidden="true" />
              <span className="text-hig-sm text-muted-foreground">Datos seguros</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 animate-fade-up stagger-3">
            <button
              onClick={handleLogin}
              className="flex items-center justify-center gap-2 px-6 py-3 text-hig-base rounded-hig border border-border bg-secondary/50 hover:bg-secondary transition-colors focus-ring"
            >
              Iniciar sesión
              <ArrowRight className="w-[var(--icon-md)] h-[var(--icon-md)]" aria-hidden="true" />
            </button>
            
            <button
              onClick={handleCreateAccount}
              className="btn-neon flex items-center justify-center gap-2 px-6 py-3 text-hig-base focus-ring"
            >
              <UserPlus className="w-[var(--icon-md)] h-[var(--icon-md)]" aria-hidden="true" />
              Crear cuenta
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-4 border-t border-border/50">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-hig-sm text-muted-foreground">
          <p>© 2025 Murphy</p>
          <p>Versión 1.0.0 - Beta</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
