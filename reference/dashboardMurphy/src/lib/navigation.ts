import { 
  LayoutDashboard, 
  Activity, 
  Bell, 
  Syringe,
  Users,
  FileText,
  Settings,
  type LucideIcon 
} from 'lucide-react';
import { UserRole } from '@/types/diabetes';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  isCenter?: boolean;
}

// Navigation items for patient/coadmin
const patientNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Glucometrías', href: '/glucometrias', icon: Activity },
  { label: 'Insulina', href: '/insulina', icon: Syringe },
  { label: 'Alertas', href: '/alertas', icon: Bell },
];

// Mobile navigation for patient/coadmin (different order with center button)
const patientMobileNavItems: NavItem[] = [
  { label: 'Alertas', href: '/alertas', icon: Bell },
  { label: 'Insulina', href: '/insulina', icon: Syringe },
  { label: 'Glucometrías', href: '/glucometrias', icon: Activity, isCenter: true },
  { label: 'Ajustes', href: '/configuracion', icon: Settings },
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
];

// Navigation items for doctor
const doctorNavItems: NavItem[] = [
  { label: 'Pacientes', href: '/medico/pacientes', icon: Users },
  { label: 'Informes', href: '/medico/informes', icon: FileText },
  { label: 'Alertas', href: '/medico/alertas', icon: Bell },
];

// Mobile navigation for doctor
const doctorMobileNavItems: NavItem[] = [
  { label: 'Alertas', href: '/medico/alertas', icon: Bell },
  { label: 'Pacientes', href: '/medico/pacientes', icon: Users, isCenter: true },
  { label: 'Informes', href: '/medico/informes', icon: FileText },
  { label: 'Ajustes', href: '/medico/configuracion', icon: Settings },
];

export function getNavItems(role: UserRole): NavItem[] {
  if (role === 'doctor') {
    return doctorNavItems;
  }
  return patientNavItems;
}

export function getMobileNavItems(role: UserRole): NavItem[] {
  if (role === 'doctor') {
    return doctorMobileNavItems;
  }
  return patientMobileNavItems;
}

export function getHomeRoute(role: UserRole): string {
  if (role === 'doctor') {
    return '/medico/pacientes';
  }
  return '/dashboard';
}

export function getSettingsRoute(role: UserRole): string {
  if (role === 'doctor') {
    return '/medico/configuracion';
  }
  return '/configuracion';
}
