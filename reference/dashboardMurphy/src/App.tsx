import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Glucometrias from "./pages/Glucometrias";
import Configuracion from "./pages/Configuracion";
import Insulina from "./pages/Insulina";
import Alertas from "./pages/Alertas";
import NotFound from "./pages/NotFound";

// Medico pages
import MedicoPacientes from "./pages/medico/Pacientes";
import MedicoPacienteDetalle from "./pages/medico/PacienteDetalle";
import MedicoInformes from "./pages/medico/Informes";
import MedicoAlertas from "./pages/medico/Alertas";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            
            {/* Patient/Coadmin routes */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/glucometrias" element={<Glucometrias />} />
            <Route path="/configuracion" element={<Configuracion />} />
            <Route path="/insulina" element={<Insulina />} />
            <Route path="/alertas" element={<Alertas />} />
            
            {/* Medico Routes */}
            <Route path="/medico/pacientes" element={<MedicoPacientes />} />
            <Route path="/medico/paciente/:id" element={<MedicoPacienteDetalle />} />
            <Route path="/medico/informes" element={<MedicoInformes />} />
            <Route path="/medico/alertas" element={<MedicoAlertas />} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
