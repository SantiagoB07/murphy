# Convex + TanStack Query Examples

This guide shows how to use TanStack Query with Convex in the Murphy app.

## Setup Complete ✓

The integration is already configured in `apps/web/src/components/providers.tsx`:

```tsx
import { ConvexQueryClient } from "@convex-dev/react-query"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!)
const convexQueryClient = new ConvexQueryClient(convex)
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryKeyHashFn: convexQueryClient.hashFn(),
      queryFn: convexQueryClient.queryFn(),
    },
  },
})
convexQueryClient.connect(queryClient)
```

## Usage Patterns

### 1. Queries (Read Data with Live Updates)

Use `useQuery` with `convexQuery` for real-time data subscriptions:

```tsx
"use client"

import { useQuery } from "@tanstack/react-query"
import { convexQuery } from "@convex-dev/react-query"
import { api } from "@murphy/backend/convex/_generated/api"

export function PatientProfile() {
  const { data, isPending, error } = useQuery(
    convexQuery(api.users.getCurrentUser, {})
  )

  if (isPending) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return <div>Welcome, {data?.fullName}!</div>
}
```

**With additional options:**

```tsx
const { data, isPending, error } = useQuery({
  ...convexQuery(api.glucometries.getRecordsInRange, { 
    startDate: "2024-01-01",
    endDate: "2024-12-31"
  }),
  initialData: [], // Fallback while loading
  gcTime: 10000, // Stay subscribed for 10s after unmount
})
```

### 2. Mutations (Write Data)

Use `useMutation` with `useConvexMutation` for database writes:

```tsx
"use client"

import { useMutation } from "@tanstack/react-query"
import { useConvexMutation } from "@convex-dev/react-query"
import { api } from "@murphy/backend/convex/_generated/api"
import { toast } from "sonner"

export function AddGlucoseButton() {
  const { mutate, isPending } = useMutation({
    mutationFn: useConvexMutation(api.glucometries.create),
    onSuccess: () => {
      toast.success("Glucometría guardada")
    },
    onError: (error) => {
      toast.error("Error al guardar")
      console.error(error)
    },
  })

  return (
    <button 
      onClick={() => mutate({ type: "breakfast", value: 120 })}
      disabled={isPending}
    >
      {isPending ? "Guardando..." : "Guardar"}
    </button>
  )
}
```

**With optimistic updates:**

```tsx
const { mutate } = useMutation({
  mutationFn: useConvexMutation(api.glucometries.update),
  onMutate: async (newData) => {
    // Cancel outgoing queries
    await queryClient.cancelQueries({ queryKey: ["glucometries"] })
    
    // Snapshot previous value
    const previous = queryClient.getQueryData(["glucometries"])
    
    // Optimistically update
    queryClient.setQueryData(["glucometries"], (old) => [...old, newData])
    
    return { previous }
  },
  onError: (err, newData, context) => {
    // Rollback on error
    queryClient.setQueryData(["glucometries"], context.previous)
  },
  onSettled: () => {
    // Refetch after mutation
    queryClient.invalidateQueries({ queryKey: ["glucometries"] })
  },
})
```

### 3. Actions (Server-side Logic + TanStack Query)

Wrap Convex actions in TanStack Query's `useMutation` for better state management:

```tsx
import { useMutation } from "@tanstack/react-query"
import { useAction } from "convex/react"
import { api } from "@murphy/backend/convex/_generated/api"
import { toast } from "sonner"

export function useOnboardingForm() {
  const onboardAction = useAction(api.users.onboardUser)

  const { mutate: onboardUser, isPending } = useMutation({
    mutationFn: async (values: FormValues) => {
      return await onboardAction({
        fullName: values.name,
        phoneNumber: values.phone,
        age: parseInt(values.age) || 0,
        gender: values.sex,
        diabetesType: values.diabetesType,
      })
    },
    throwOnError: false,
    onError: (error) => {
      console.error(error)
      toast.error("Error al completar el registro")
    },
    onSuccess: async () => {
      toast.success("Perfil completado exitosamente")
      window.location.replace('/dashboard')
    },
  })

  return { onboardUser, isPending }
}
```

**Benefits of wrapping actions:**
- Centralized loading state (`isPending`)
- Consistent error handling
- Success/error callbacks
- Better integration with forms

### 4. Mixing Both Approaches

You can use TanStack Query and standard Convex hooks side by side:

```tsx
"use client"

import { useQuery } from "@tanstack/react-query"
import { convexQuery } from "@convex-dev/react-query"
import { useAction } from "convex/react"
import { api } from "@murphy/backend/convex/_generated/api"

export function Dashboard() {
  // TanStack Query for real-time data
  const { data: records } = useQuery(
    convexQuery(api.glucometries.getRecent, {})
  )

  // Standard Convex hook for actions
  const syncData = useAction(api.sync.syncWithDevice)

  return (
    <div>
      <h1>Recent Records: {records?.length}</h1>
      <button onClick={() => syncData()}>Sync Device</button>
    </div>
  )
}
```

## When to Use What

### Use TanStack Query (`useQuery` + `convexQuery`) when:
- ✅ You need live-updating data subscriptions
- ✅ You want to use TanStack Query features (caching, refetching, etc.)
- ✅ You're fetching data to display in the UI
- ✅ You want type-safe queries with IntelliSense

### Use TanStack Mutation (`useMutation`) when:
- ✅ Writing data to the database (wrap `useConvexMutation`)
- ✅ Calling Convex actions (wrap `useAction`)
- ✅ You need centralized loading/error states
- ✅ You want optimistic updates
- ✅ You want to invalidate queries after mutations
- ✅ Better form integration and state management

### Use Standard Convex Hooks when:
- ✅ Simple one-off actions without complex state management
- ✅ You prefer the direct Convex API
- ✅ The component already has its own loading/error handling

## Key Differences from Standard Fetch

1. **No Manual Refetching Needed**: Convex pushes updates automatically
2. **Always Fresh Data**: `isStale` is always `false`
3. **Reactive Subscriptions**: Data updates in real-time across all clients
4. **No `refetch` Options**: Not needed since data is always up to date

## Real-World Example: Onboarding Form

Here's a complete example from Murphy's onboarding flow:

**apps/web/src/app/onboarding/-components/useOnboardingForm.ts:**
```tsx
"use client"

import { useForm } from "@tanstack/react-form"
import { useMutation } from "@tanstack/react-query"
import { useAction } from "convex/react"
import { toast } from "sonner"
import { useUser } from "@clerk/nextjs"
import { api } from "@murphy/backend/convex/_generated/api"

type FormValues = {
  name: string
  phone: string
  age: string
  sex: 'masculino' | 'femenino' | 'otro' | 'prefiero_no_decir'
  diabetesType: 'Tipo 1' | 'Tipo 2' | 'Gestacional' | 'LADA' | 'MODY'
  diagnosisYear: string
  residence: string
  socioeconomicLevel: string
}

export function useOnboardingForm() {
  const { user } = useUser()
  const onboardAction = useAction(api.users.onboardUser)

  // Wrap Convex action in TanStack mutation for better state management
  const { mutate: onboardUser, isPending } = useMutation({
    mutationFn: async (values: FormValues) => {
      return await onboardAction({
        fullName: values.name,
        phoneNumber: values.phone,
        age: parseInt(values.age) || 0,
        gender: values.sex,
        diabetesType: values.diabetesType,
        diagnosisYear: values.diagnosisYear ? parseInt(values.diagnosisYear) : undefined,
        city: values.residence || undefined,
        estrato: values.socioeconomicLevel ? parseInt(values.socioeconomicLevel) : undefined,
      })
    },
    throwOnError: false,
    onError: (error) => {
      console.error('Error during onboarding:', error)
      toast.error("Error al completar el registro. Por favor intenta de nuevo.")
    },
    onSuccess: async () => {
      // Reload user to ensure publicMetadata is fresh
      await user?.reload()
      toast.success("Perfil completado exitosamente")
      window.location.replace('/dashboard')
    },
  })

  const form = useForm({
    defaultValues: {
      name: '',
      phone: '',
      age: '',
      sex: '' as FormValues['sex'],
      diabetesType: '' as FormValues['diabetesType'],
      diagnosisYear: '',
      residence: '',
      socioeconomicLevel: '',
    },
    onSubmit: async ({ value }) => {
      onboardUser(value)
    },
  })

  return { form, isPending }
}
```

**Key benefits of this pattern:**
- ✅ Single `isPending` state for the entire form
- ✅ Centralized error handling with toasts
- ✅ Success callbacks for user reload + redirect
- ✅ Clean separation: TanStack Form for form state, TanStack Query for async state
- ✅ Type-safe mutations with IntelliSense

## Important Notes

- Data is **never stale** with Convex - updates are pushed automatically
- Subscriptions stay active for `gcTime` (default 5 minutes) after component unmount
- Use smaller `gcTime` if you want to reduce function activity
- TanStack Query retry options are ignored (Convex has built-in retry)
- All TanStack Query features work, but some are unnecessary due to Convex's reactivity

## Migration from Standard Convex Hooks

**Before:**
```tsx
import { useQuery } from "convex/react"

const data = useQuery(api.users.getCurrent, {})
```

**After:**
```tsx
import { useQuery } from "@tanstack/react-query"
import { convexQuery } from "@convex-dev/react-query"

const { data } = useQuery(convexQuery(api.users.getCurrent, {}))
```

Benefits:
- Access to TanStack Query's powerful features
- Better TypeScript inference
- Consistent API if you're already using TanStack Query
- Can leverage React Query DevTools

## DevTools (Optional)

Add React Query DevTools for debugging:

```bash
pnpm add @tanstack/react-query-devtools
```

```tsx
// apps/web/src/components/providers.tsx
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"

export default function Providers({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```
