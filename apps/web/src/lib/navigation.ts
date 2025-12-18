import {
  LayoutDashboard,
  Activity,
  Bell,
  Syringe,
  Settings,
  type LucideIcon,
} from "lucide-react"

// Patient route type - all valid routes for the patient dashboard
export type PatientRoute =
  | "/dashboard"
  | "/glucometrias"
  | "/insulina"
  | "/alertas"
  | "/configuracion"

export interface NavItem {
  label: string
  href: PatientRoute
  icon: LucideIcon
  isCenter?: boolean
}

// Navigation items for patient
const patientNavItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Glucometrias", href: "/glucometrias", icon: Activity },
  { label: "Insulina", href: "/insulina", icon: Syringe },
  { label: "Alertas", href: "/alertas", icon: Bell },
]

// Mobile navigation for patient (different order with center button)
const patientMobileNavItems: NavItem[] = [
  { label: "Alertas", href: "/alertas", icon: Bell },
  { label: "Insulina", href: "/insulina", icon: Syringe },
  { label: "Glucometrias", href: "/glucometrias", icon: Activity, isCenter: true },
  { label: "Ajustes", href: "/configuracion", icon: Settings },
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
]

export function getNavItems(): NavItem[] {
  return patientNavItems
}

export function getMobileNavItems(): NavItem[] {
  return patientMobileNavItems
}

export function getHomeRoute(): PatientRoute {
  return "/dashboard"
}

export function getSettingsRoute(): PatientRoute {
  return "/configuracion"
}
