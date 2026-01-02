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
// Labels are translation keys - use with t(`Navigation.${item.label}`)
const patientNavItems: NavItem[] = [
  { label: "dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "glucometrias", href: "/glucometrias", icon: Activity },
  { label: "insulina", href: "/insulina", icon: Syringe },
  { label: "alertas", href: "/alertas", icon: Bell },
]

// Mobile navigation for patient (different order with center button)
// Labels are translation keys - use with t(`Navigation.${item.label}`)
const patientMobileNavItems: NavItem[] = [
  { label: "alertas", href: "/alertas", icon: Bell },
  { label: "insulina", href: "/insulina", icon: Syringe },
  { label: "glucometrias", href: "/glucometrias", icon: Activity, isCenter: true },
  { label: "settings", href: "/configuracion", icon: Settings },
  { label: "dashboard", href: "/dashboard", icon: LayoutDashboard },
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
