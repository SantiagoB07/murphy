# Frontend Architecture Patterns

This document defines the patterns and conventions for the Murphy frontend codebase.

## Table of Contents

1. [Directory Structure](#directory-structure)
2. [Component Locations](#component-locations)
3. [Component Patterns](#component-patterns)
4. [Data Fetching Patterns](#data-fetching-patterns)
5. [Convex Hook Patterns](#convex-hook-patterns)
6. [Composition Patterns](#composition-patterns)
7. [Dialog Patterns](#dialog-patterns)
8. [Key Principles](#key-principles)

---

## Directory Structure

```
src/
  features/              # Feature-based organization
    glucose/
      hooks/             # Feature-specific Convex hooks
        useGlucoseRecords.ts
        useGlucoseMutations.ts
      components/        # Reusable domain components
        GlucoseDialog.tsx
        GlucoseRecordCard.tsx
      context/           # Feature-specific context (if needed)
        GlucoseDialogContext.tsx
      utils/             # Feature-specific utilities
        calculatePeriodStats.ts
      glucose.types.ts   # Feature types
      index.ts           # Barrel export
    wellness/
      ...
    insulin/
      ...
    alerts/
      ...
    xp/
      ...
  components/
    ui/                  # shadcn primitives (Button, Dialog, Card)
    composed/            # Composed UI patterns (StatCard, DataCard)
    navigation/          # App-wide navigation components
    providers/           # Context providers
  hooks/                 # Non-domain utilities only (use-mobile.tsx)
  lib/                   # Utilities
  app/                   # Next.js pages
    (dashboard)/
      glucometrias/
        page.tsx         # Thin page - composition only
        -components/     # Page-specific components
          GlucometriasContent.tsx
          GlucometriasHeader.tsx
          WeeklyView.tsx
          MonthlyView.tsx
```

---

## Component Locations

Components can live in three locations, each with a distinct purpose:

### 1. `src/components/` - Generic UI Toolkit

**Purpose**: Domain-agnostic, reusable UI building blocks.

| Subfolder | Contents | Examples |
|-----------|----------|----------|
| `ui/` | shadcn primitives | Button, Dialog, Card, Input |
| `composed/` | Composed patterns | StatCard, DataCard |
| `navigation/` | App-wide navigation | TopNavbar, MobileBottomNav |
| `providers/` | Context providers | ThemeProvider |

**When to use**: Component has NO business logic and could be used in any app.

```typescript
// components/composed/StatCard.tsx
// Generic stat display - no domain knowledge
export function StatCard({ label, value, icon }) { ... }
```

### 2. `features/[domain]/components/` - Domain Components

**Purpose**: Domain-specific components **reused across multiple pages**.

**When to use**: Component represents a domain concept AND is used in 2+ pages.

```typescript
// features/glucose/components/GlucoseRecordCard.tsx
// Used in: dashboard, glucometrias page
export function GlucoseRecordCard({ record, onEdit, onDelete }) { ... }

// features/glucose/components/GlucoseDialog.tsx
// Used in: dashboard, glucometrias page
export function GlucoseDialog({ open, onOpenChange }) { ... }
```

**Import pattern**:
```typescript
import { GlucoseRecordCard, GlucoseDialog } from "@/features/glucose"
```

### 3. `app/.../-components/` - Page-Specific Components

**Purpose**: Components **only used by that specific page**.

The `-` prefix is a Next.js convention to mark "private" folders excluded from routing.

**When to use**: Component is specific to one page's layout/structure.

```typescript
// app/(dashboard)/glucometrias/-components/
GlucometriasContent.tsx   // Container - orchestrates the page
GlucometriasHeader.tsx    // Page header
WeeklyView.tsx            // Only used in glucometrias
MonthlyView.tsx           // Only used in glucometrias
QuarterlyView.tsx         // Only used in glucometrias
```

**Import pattern** (relative imports):
```typescript
import { GlucometriasContent } from "./-components/GlucometriasContent"
```

### Decision Flow

```
Is it a generic UI primitive/pattern?
  │
  ├── YES → src/components/ui/ or src/components/composed/
  │
  └── NO → Is it used in multiple pages?
              │
              ├── YES → features/[domain]/components/
              │
              └── NO → app/.../-components/
```

### Summary Table

| Location | Scope | Domain-specific? | Import Path |
|----------|-------|------------------|-------------|
| `components/ui/` | App-wide | No | `@/components/ui/button` |
| `components/composed/` | App-wide | No | `@/components/composed` |
| `features/[domain]/components/` | Cross-page | Yes | `@/features/glucose` |
| `app/.../-components/` | Single page | Yes | `"./-components/X"` |

---

## Component Patterns

### Container Components

Container components are responsible for:
- Fetching data using hooks
- Managing local state
- Passing data to presentational components

```typescript
// features/glucose/components/GlucoseRecordList.tsx
"use client"

import { useGlucoseRecords } from "../hooks/useGlucoseRecords"
import { GlucoseRecordCard } from "./GlucoseRecordCard"
import { GlucoseRecordListSkeleton } from "./GlucoseRecordListSkeleton"
import { GlucoseRecordListEmpty } from "./GlucoseRecordListEmpty"

interface GlucoseRecordListProps {
  date: Date
}

export function GlucoseRecordList({ date }: GlucoseRecordListProps) {
  const { records, isLoading } = useGlucoseRecords({ date })
  
  if (isLoading) return <GlucoseRecordListSkeleton />
  if (!records.length) return <GlucoseRecordListEmpty />
  
  return (
    <div className="space-y-3">
      {records.map(record => (
        <GlucoseRecordCard key={record._id} record={record} />
      ))}
    </div>
  )
}
```

### Presentational Components

Presentational components are responsible for:
- Rendering UI based on props
- Handling UI interactions (not business logic)
- Being reusable and testable

```typescript
// features/glucose/components/GlucoseRecordCard.tsx
import { Doc, Id } from "@murphy/backend/convex/_generated/dataModel"
import { cn } from "@/lib/utils"

interface GlucoseRecordCardProps {
  record: Doc<"glucoseRecords">
  onEdit?: (id: Id<"glucoseRecords">) => void
  onDelete?: (id: Id<"glucoseRecords">) => void
}

export function GlucoseRecordCard({ 
  record, 
  onEdit, 
  onDelete 
}: GlucoseRecordCardProps) {
  // Pure presentation logic only - no hooks, no data fetching
  return (
    <article className="glass-card p-4">
      {/* UI rendering */}
    </article>
  )
}
```

---

## Data Fetching Patterns

### Where to Fetch Data

| Component Type | Can Fetch Data? | Example |
|---------------|-----------------|---------|
| Page (`page.tsx`) | No | Layout and composition only |
| Container Component | Yes | `GlucoseRecordList` |
| Presentational Component | No | `GlucoseRecordCard` |
| Custom Hook | Yes | `useGlucoseRecords` |

### Pages Should Be Thin

Pages should only handle:
- Importing and composing container components
- Provider wrapping (if needed)
- Route-level concerns

**Pattern**: Each page imports a `XxxContent` component from `-components/` that handles all the logic.

```typescript
// app/(dashboard)/glucometrias/page.tsx
"use client"

import { GlucometriasContent } from "./-components/GlucometriasContent"

export default function GlucometriasPage() {
  return <GlucometriasContent />
}
```

The `XxxContent` component is a **container** that:
- Fetches data using `features/` hooks
- Manages local state (dialogs, view modes, etc.)
- Composes presentational components from `-components/`

```typescript
// app/(dashboard)/glucometrias/-components/GlucometriasContent.tsx
"use client"

import { useState } from "react"
import { useGlucoseRecords, useGlucoseMutations } from "@/features/glucose"
import { useWellnessRecords } from "@/features/wellness"
import { GlucometriasHeader } from "./GlucometriasHeader"
import { WeeklyView } from "./WeeklyView"
import { MonthlyView } from "./MonthlyView"

export function GlucometriasContent() {
  const [viewMode, setViewMode] = useState<ViewMode>("daily")
  const { records, isLoading } = useGlucoseRecords()
  const { createRecord, deleteRecord } = useGlucoseMutations()
  
  if (isLoading) return <GlucometriasSkeleton />
  
  return (
    <>
      <GlucometriasHeader viewMode={viewMode} />
      {viewMode === "weekly" && <WeeklyView records={records} />}
      {viewMode === "monthly" && <MonthlyView records={records} />}
    </>
  )
}
```

---

## Convex Hook Patterns

### Query Hooks

Use TanStack Query with Convex for data fetching:

```typescript
// features/glucose/hooks/useGlucoseRecords.ts
"use client"

import { useQuery } from "@tanstack/react-query"
import { convexQuery } from "@convex-dev/react-query"
import { api } from "@murphy/backend/convex/_generated/api"
import { Doc } from "@murphy/backend/convex/_generated/dataModel"

interface UseGlucoseRecordsOptions {
  date?: Date
}

interface UseGlucoseRecordsReturn {
  records: Doc<"glucoseRecords">[]
  isLoading: boolean
  error: Error | null
}

export function useGlucoseRecords(
  options?: UseGlucoseRecordsOptions
): UseGlucoseRecordsReturn {
  const { data, isPending, error } = useQuery(
    convexQuery(api.glucoseRecords.list, {})
  )
  
  return {
    records: data ?? [],
    isLoading: isPending,
    error: error ?? null,
  }
}
```

### Mutation Hooks

Separate mutations into their own hook:

```typescript
// features/glucose/hooks/useGlucoseMutations.ts
"use client"

import { useMutation } from "@tanstack/react-query"
import { useConvexMutation } from "@convex-dev/react-query"
import { api } from "@murphy/backend/convex/_generated/api"
import { Id } from "@murphy/backend/convex/_generated/dataModel"
import { toast } from "sonner"

export function useGlucoseMutations() {
  const createMutation = useMutation({
    mutationFn: useConvexMutation(api.glucoseRecords.create),
    onSuccess: () => toast.success("Glucosa registrada"),
    onError: () => toast.error("Error al guardar glucosa"),
  })

  const deleteMutation = useMutation({
    mutationFn: useConvexMutation(api.glucoseRecords.remove),
    onSuccess: () => toast.success("Registro eliminado"),
    onError: () => toast.error("Error al eliminar"),
  })

  return {
    createRecord: createMutation.mutate,
    isCreating: createMutation.isPending,
    deleteRecord: (id: Id<"glucoseRecords">) => 
      deleteMutation.mutate({ id }),
    isDeleting: deleteMutation.isPending,
  }
}
```

### TypeScript with Convex

Use Convex generated types for end-to-end type safety:

```typescript
// Import document types from generated dataModel
import { Doc, Id } from "@murphy/backend/convex/_generated/dataModel"

// Use Doc<"tableName"> for full document types
type GlucoseRecord = Doc<"glucoseRecords">

// Use Id<"tableName"> for document ID references
function deleteRecord(id: Id<"glucoseRecords">) { ... }
```

---

## Composition Patterns

### Radix-Style Composition

Build flexible components using compound component pattern:

```typescript
// components/composed/StatCard.tsx
import { cn } from "@/lib/utils"

interface StatCardProps {
  children: React.ReactNode
  className?: string
}

function StatCard({ children, className }: StatCardProps) {
  return (
    <article className={cn("glass-card p-4", className)}>
      {children}
    </article>
  )
}

function StatCardIcon({ 
  children, 
  className 
}: { 
  children: React.ReactNode
  className?: string 
}) {
  return (
    <div className={cn(
      "w-10 h-10 rounded-xl flex items-center justify-center",
      className
    )}>
      {children}
    </div>
  )
}

function StatCardLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-muted-foreground">{children}</p>
}

function StatCardValue({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xl font-bold text-foreground leading-tight">
      {children}
    </p>
  )
}

// Attach sub-components
StatCard.Icon = StatCardIcon
StatCard.Label = StatCardLabel
StatCard.Value = StatCardValue

export { StatCard }
```

Usage:

```tsx
<StatCard>
  <StatCard.Icon className="bg-purple-500/20">
    <Activity className="w-5 h-5 text-purple-400" />
  </StatCard.Icon>
  <div>
    <StatCard.Label>Ultima glucosa</StatCard.Label>
    <StatCard.Value>120 mg/dL</StatCard.Value>
  </div>
</StatCard>
```

---

## Dialog Patterns

### Dialog Context Pattern

Move dialog state out of pages using context:

```typescript
// features/glucose/context/GlucoseDialogContext.tsx
"use client"

import { createContext, useContext, useState, useCallback } from "react"
import { Doc } from "@murphy/backend/convex/_generated/dataModel"
import { AddGlucoseDialog } from "../components/AddGlucoseDialog"

type DialogType = "add" | "edit" | null

interface DialogState {
  type: DialogType
  record?: Doc<"glucoseRecords">
}

interface GlucoseDialogContextValue {
  openAddDialog: () => void
  openEditDialog: (record: Doc<"glucoseRecords">) => void
  closeDialog: () => void
}

const GlucoseDialogContext = createContext<GlucoseDialogContextValue | null>(null)

export function GlucoseDialogProvider({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const [state, setState] = useState<DialogState>({ type: null })

  const openAddDialog = useCallback(() => {
    setState({ type: "add" })
  }, [])

  const openEditDialog = useCallback((record: Doc<"glucoseRecords">) => {
    setState({ type: "edit", record })
  }, [])

  const closeDialog = useCallback(() => {
    setState({ type: null })
  }, [])

  return (
    <GlucoseDialogContext.Provider 
      value={{ openAddDialog, openEditDialog, closeDialog }}
    >
      {children}
      <AddGlucoseDialog
        open={state.type !== null}
        onOpenChange={(open) => !open && closeDialog()}
        initialRecord={state.record}
      />
    </GlucoseDialogContext.Provider>
  )
}

export function useGlucoseDialog() {
  const context = useContext(GlucoseDialogContext)
  if (!context) {
    throw new Error("useGlucoseDialog must be used within GlucoseDialogProvider")
  }
  return context
}
```

Usage in components:

```tsx
// In any component within the provider
function GlucoseRecordCard({ record }) {
  const { openEditDialog } = useGlucoseDialog()
  
  return (
    <Button onClick={() => openEditDialog(record)}>
      Edit
    </Button>
  )
}
```

---

## Key Principles

1. **Pages are thin** - Pages import a single `XxxContent` container component
2. **Containers fetch** - Only container components (`XxxContent`) use data hooks
3. **Presentational are pure** - No hooks, just props
4. **Compose over configure** - Prefer composition API over prop objects
5. **Colocate by feature** - Keep related domain code together in `features/`
6. **Right location for components**:
   - Generic UI → `components/`
   - Domain + reusable → `features/[domain]/components/`
   - Page-specific → `-components/`
7. **Use Convex generated types** - Prefer `Doc<"table">` and `Id<"table">` over manual interfaces
8. **Frontend types stay in frontend** - Define form/UI types locally in feature modules
9. **Domain hooks in features/** - Only non-domain utilities (like `use-mobile`) stay in `src/hooks/`

---

## Migration Guide

When refactoring existing components:

1. Identify if component is container or presentational
2. Extract data fetching into custom hooks in `features/[domain]/hooks/`
3. Determine component location:
   - Used in multiple pages? → `features/[domain]/components/`
   - Page-specific? → `app/.../-components/`
   - Generic UI? → `src/components/`
4. Update imports in consuming files
5. Add to feature barrel export (`features/[domain]/index.ts`)

