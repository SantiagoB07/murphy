# Frontend Architecture Patterns

This document defines the patterns and conventions for the Murphy frontend codebase.

## Table of Contents

1. [Directory Structure](#directory-structure)
2. [Component Patterns](#component-patterns)
3. [Data Fetching Patterns](#data-fetching-patterns)
4. [Convex Hook Patterns](#convex-hook-patterns)
5. [Composition Patterns](#composition-patterns)
6. [Dialog Patterns](#dialog-patterns)
7. [Key Principles](#key-principles)

---

## Directory Structure

```
src/
  features/              # Feature-based organization
    glucose/
      hooks/             # Feature-specific Convex hooks
        useGlucoseRecords.ts
        useGlucoseMutations.ts
      components/        # Feature components
        GlucoseRecordCard.tsx
        GlucoseRecordList.tsx
      context/           # Feature-specific context (if needed)
        GlucoseDialogContext.tsx
      glucose.types.ts   # Feature types
      index.ts           # Barrel export
    wellness/
      ...
    insulin/
      ...
  components/
    ui/                  # shadcn primitives (unchanged)
    composed/            # Composed UI patterns built from primitives
  hooks/                 # Shared hooks (non-feature-specific)
  lib/                   # Utilities
  app/                   # Next.js pages (thin, layout only)
```

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
- Layout composition
- Provider wrapping
- Route-level concerns

```typescript
// app/(dashboard)/glucometrias/page.tsx
"use client"

import { GlucosePageHeader } from "@/features/glucose/components/GlucosePageHeader"
import { GlucoseRecordList } from "@/features/glucose/components/GlucoseRecordList"
import { GlucoseDialogProvider } from "@/features/glucose/context/GlucoseDialogProvider"

export default function GlucometriasPage() {
  return (
    <GlucoseDialogProvider>
      <GlucosePageHeader />
      <GlucoseRecordList date={new Date()} />
    </GlucoseDialogProvider>
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

1. **Pages are thin** - Only layout, providers, and top-level composition
2. **Containers fetch** - Only container components use data hooks
3. **Presentational are pure** - No hooks, just props
4. **Compose over configure** - Prefer composition API over prop objects
5. **Colocate by feature** - Keep related code together
6. **Use Convex generated types** - Prefer `Doc<"table">` and `Id<"table">` over manual interfaces
7. **Frontend types stay in frontend** - Define form/UI types locally in feature modules

---

## Migration Guide

When refactoring existing components:

1. Identify if component is container or presentational
2. Extract data fetching into custom hooks
3. Move to appropriate feature directory
4. Update imports in consuming files
5. Add to feature barrel export

