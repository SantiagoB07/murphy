# UI Migration Plan: `a_murphy` → `@apps/web`

## Summary

Migrate the **patient-facing UI only** from a diabetes management app (`a_murphy`) to the monorepo target (`@apps/web`). Both share the same purple HIG design system. Backend calls will be mocked/removed, custom Tailwind classes replaced with standard ones, and auth values hardcoded.

**Scope:** Patient features only - excluding Co-admin and Doctor (Médico) interfaces.

---

## Phase 1: Install Missing Shadcn Components

**Location:** `apps/web`

Install 36 missing components (batch command):

```bash
pnpm dlx shadcn@latest add accordion alert alert-dialog aspect-ratio avatar badge breadcrumb calendar carousel chart command context-menu dialog drawer hover-card input-otp menubar navigation-menu pagination popover progress radio-group resizable scroll-area separator sheet sidebar slider switch table tabs textarea toast toggle toggle-group tooltip
```

---

## Phase 2: Add Missing NPM Dependencies

Add to `apps/web/package.json`:

| Package | Version | Purpose |
|---------|---------|---------|
| `recharts` | `^3.5.1` | Charts (GlucoseChart) |
| `date-fns` | `^4.1.0` | Date utilities |
| `react-day-picker` | `^9.12.0` | Calendar component |
| `embla-carousel-react` | `^8.6.0` | Carousel component |
| `vaul` | `^1.1.2` | Drawer component |
| `cmdk` | `^1.1.1` | Command component |
| `react-resizable-panels` | `^3.0.6` | Resizable panels |
| `input-otp` | `^1.4.2` | OTP input |
| `@tanstack/react-query` | `^5.90.12` | Data fetching (mock) |

---

## Phase 3: Migrate Supporting Files

### 3.1 Types
| Source | Target |
|--------|--------|
| `app/types/diabetes.ts` | `src/types/diabetes.ts` |

### 3.2 Hooks  
| Source | Target |
|--------|--------|
| `app/hooks/use-mobile.tsx` | `src/hooks/use-mobile.tsx` |
| `app/hooks/use-toast.ts` | `src/hooks/use-toast.ts` |

### 3.3 Lib/Utils
| Source | Target | Notes |
|--------|--------|-------|
| `app/lib/navigation.ts` | `src/lib/navigation.ts` | Patient routes only |
| `app/lib/utils.ts` | `src/lib/utils.ts` | Merge with existing |

---

## Phase 4: Migrate Custom Components (21 files - Patient Only)

### 4.1 Navigation (2 files)
| Source | Target | Notes |
|--------|--------|-------|
| `app/components/navigation/TopNavbar.tsx` | `src/components/navigation/TopNavbar.tsx` | Patient routes only |
| `app/components/navigation/MobileBottomNav.tsx` | `src/components/navigation/MobileBottomNav.tsx` | Patient routes only |

### 4.2 Dashboard (4 files)
| Source | Target | Notes |
|--------|--------|-------|
| `app/components/dashboard/DashboardLayout.tsx` | `src/components/dashboard/DashboardLayout.tsx` | Patient layout only |
| `app/components/dashboard/AlertsPanel.tsx` | `src/components/dashboard/AlertsPanel.tsx` | |
| `app/components/dashboard/GlucoseChart.tsx` | `src/components/dashboard/GlucoseChart.tsx` | |
| `app/components/dashboard/HabitTrackerCard.tsx` | `src/components/dashboard/HabitTrackerCard.tsx` | |

### 4.3 Glucose (8 files)
| Source | Target |
|--------|--------|
| `app/components/glucose/GlucoseLogSheet.tsx` | `src/components/glucose/GlucoseLogSheet.tsx` |
| `app/components/glucose/GlucoseSlotCard.tsx` | `src/components/glucose/GlucoseSlotCard.tsx` |
| `app/components/glucose/GlucoseTreatmentSlotCard.tsx` | `src/components/glucose/GlucoseTreatmentSlotCard.tsx` |
| `app/components/glucose/MonthlyView.tsx` | `src/components/glucose/MonthlyView.tsx` |
| `app/components/glucose/PeriodStatsCard.tsx` | `src/components/glucose/PeriodStatsCard.tsx` |
| `app/components/glucose/QuarterlyView.tsx` | `src/components/glucose/QuarterlyView.tsx` |
| `app/components/glucose/ViewModeSelector.tsx` | `src/components/glucose/ViewModeSelector.tsx` |
| `app/components/glucose/WeeklyView.tsx` | `src/components/glucose/WeeklyView.tsx` |

### 4.4 Insulin (2 files)
| Source | Target |
|--------|--------|
| `app/components/insulin/InsulinConfigCard.tsx` | `src/components/insulin/InsulinConfigCard.tsx` |
| `app/components/insulin/InsulinSlotCard.tsx` | `src/components/insulin/InsulinSlotCard.tsx` |

### 4.5 Alerts (1 file)
| Source | Target |
|--------|--------|
| `app/components/alerts/CreateAlertDialog.tsx` | `src/components/alerts/CreateAlertDialog.tsx` |

### 4.6 Daily Log (1 file)
| Source | Target |
|--------|--------|
| `app/components/daily-log/DailyLogInputDialog.tsx` | `src/components/daily-log/DailyLogInputDialog.tsx` |

### 4.7 Settings (3 files)
| Source | Target |
|--------|--------|
| `app/components/settings/DevicesSheet.tsx` | `src/components/settings/DevicesSheet.tsx` |
| `app/components/settings/NotificationsSheet.tsx` | `src/components/settings/NotificationsSheet.tsx` |
| `app/components/settings/PersonalDataSheet.tsx` | `src/components/settings/PersonalDataSheet.tsx` |

---

## Phase 5: Migrate Page Routes (5 pages - Patient Only)

### 5.1 Patient Routes
| Source | Target |
|--------|--------|
| `app/(dashboard)/dashboard/page.tsx` | `src/app/(dashboard)/dashboard/page.tsx` |
| `app/(dashboard)/glucometrias/page.tsx` | `src/app/(dashboard)/glucometrias/page.tsx` |
| `app/(dashboard)/insulina/page.tsx` | `src/app/(dashboard)/insulina/page.tsx` |
| `app/(dashboard)/alertas/page.tsx` | `src/app/(dashboard)/alertas/page.tsx` |
| `app/(dashboard)/configuracion/page.tsx` | `src/app/(dashboard)/configuracion/page.tsx` |

### 5.2 Layout
| Source | Target |
|--------|--------|
| Create new | `src/app/(dashboard)/layout.tsx` |

---

## Phase 6: Code Transformations (During Migration)

### 6.1 Import Path Updates
| From | To |
|------|-----|
| `@/app/components/ui/` | `@/components/ui/` |
| `@/app/components/` | `@/components/` |
| `@/app/lib/` | `@/lib/` |
| `@/app/hooks/` | `@/hooks/` |
| `@/app/types/` | `@/types/` |

### 6.2 Custom Tailwind Class Replacements
| Custom Class | Standard Replacement |
|--------------|---------------------|
| `rounded-hig` | `rounded-xl` |
| `text-hig-xs` | `text-xs` |
| `text-hig-sm` | `text-sm` |
| `text-hig-base` | `text-base` |
| `text-hig-lg` | `text-lg` |
| `text-hig-xl` | `text-xl` |
| `text-hig-2xl` | `text-2xl` |
| `text-hig-3xl` | `text-3xl` |
| `leading-hig-tight` | `leading-tight` |
| `leading-hig-normal` | `leading-normal` |
| `duration-hig-fast` | `duration-150` |
| `duration-hig-slow` | `duration-300` |
| `ease-hig-out` | `ease-out` |

### 6.3 Backend Mocking Strategy
For each backend call, replace with mock:

```typescript
// BEFORE (Supabase)
const { data: currentPatient, isLoading } = usePatient(patientId);

// AFTER (Mock)
const currentPatient = MOCK_PATIENT; // hardcoded mock data
const isLoading = false;
```

Create `src/lib/mock-data.ts` with hardcoded patient/doctor data.

### 6.4 Auth Hardcoding
```typescript
// BEFORE
const storedRole = localStorage.getItem('userRole') as UserRole;
const storedPatientId = localStorage.getItem('murphy-patient-id');

// AFTER
const userRole: UserRole = 'patient'; // hardcoded - always patient
const patientId = 'mock-patient-1';   // hardcoded
```

### 6.5 Remove Co-admin and Doctor Logic
- Remove `userRole` conditionals for 'coadmin' and 'doctor'
- Remove doctor/medico navigation items
- Remove PatientCard component (coadmin-only feature)
- Simplify navigation to patient-only routes

---

## Phase 7: Create Mock Data File

Create `src/lib/mock-data.ts` with sample data for:
- 1 Patient with glucometries, insulin doses, sleep records
- Treatment schedule with glucose/insulin slots
- Alerts/reminders
- Mock API response helpers

---

## Phase 8: Verification

1. Run `pnpm install` in `apps/web`
2. Run `pnpm build` to check for TypeScript errors
3. Run `pnpm dev` and manually test each route
4. Verify responsive design on mobile/tablet/desktop

---

## File Count Summary

| Category | Count |
|----------|-------|
| Shadcn components (install) | 36 |
| Custom components | 21 (patient-only) |
| Pages | 5 (patient-only) |
| Hooks | 2 |
| Types | 1 |
| Lib files | 2 |
| Mock data | 1 |
| **Total files to create/migrate** | **32** |

---

## Notes

- Both projects use the same purple HIG design system
- Target already has Tailwind v4 CSS migrated
- Source uses Supabase for backend; target will use mocked data
- All Spanish labels and content preserved
- Custom Tailwind utilities (`rounded-hig`, `text-hig-*`) will be replaced with standard classes
- Focus is UI-only migration; backend integration comes later
- **Patient-only scope:** Co-admin and Doctor interfaces excluded
- UserRole type simplified to 'patient' only in migrated code
