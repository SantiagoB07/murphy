# Form Building Pattern

A comprehensive guide for building type-safe, validated forms using TanStack Form with React.

## Overview

This pattern uses TanStack Form for form state management, Zod for schema validation, and shadcn/ui components for the UI layer. It separates concerns into modular components while maintaining type safety throughout.

## Directory Structure

```
feature/
├── page.tsx                    # Main page component
├── layout.tsx                  # Route layout with auth guards
└── -components/
    ├── FeatureForm.tsx         # Main form component
    ├── useFeatureForm.ts       # Form logic hook
    ├── FormActions.tsx         # Submit/reset buttons
    ├── FeatureHeader.tsx       # Header section
    └── FeatureFooter.tsx       # Footer section
```

## Core Components

### 1. Custom Hook: `useFeatureForm.ts`

The hook encapsulates all form logic, validation, and submission handling.

**Key responsibilities:**
- Define Zod schema for type safety
- Initialize TanStack Form with default values
- Handle form submission and API calls
- Manage loading states

**Example:**

```typescript
"use client";

import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { z } from "zod";
import { useAction } from "convex/react";
import { api } from "@murphy/backend/convex/_generated/api";

// Define validation schema
export const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(10).max(10),
  age: z.string(),
  sex: z.enum(['male', 'female', 'other', 'prefer_not_to_say', '']),
});

export function useFeatureForm() {
  const [isPending, setIsPending] = useState(false);
  const submitAction = useAction(api.feature.submit);

  const form = useForm({
    defaultValues: {
      name: '',
      phone: '',
      age: '',
      sex: '' as '' | 'male' | 'female' | 'other' | 'prefer_not_to_say',
    },
    onSubmit: async ({ value }) => {
      try {
        setIsPending(true);
        
        await submitAction({
          fullName: value.name,
          phoneNumber: value.phone,
          age: parseInt(value.age) || 0,
          gender: value.sex,
        });

        // Redirect after success
        window.location.href = '/dashboard';
      } catch (error) {
        console.error('Submission error:', error);
        throw error;
      } finally {
        setIsPending(false);
      }
    },
  });

  return { form, isPending };
}
```

**Key patterns:**
- Use Zod for schema definition and type inference
- Separate loading state from form state
- Transform form values to match API requirements in `onSubmit`
- Use `window.location.href` for full page redirects when auth state needs refresh

### 2. Form Component: `FeatureForm.tsx`

The presentation layer that renders form fields using TanStack Form's field API.

**Key responsibilities:**
- Render form fields with proper accessibility
- Display validation errors inline
- Handle field-level validation
- Manage disabled states during submission

**Field Pattern:**

```tsx
<form.Field 
  name="fieldName"
  validators={{
    onChange: ({ value }) => {
      if (!value) return 'Field is required';
      if (value.length < 3) return 'Must be at least 3 characters';
      return undefined;
    },
  }}
>
  {(field) => (
    <div>
      <Label htmlFor={field.name}>Field Label *</Label>
      <Input 
        id={field.name}
        name={field.name}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        placeholder="Example value"
        disabled={isPending}
      />
      {field.state.meta.errors.length > 0 && (
        <p className="text-sm text-destructive mt-1">
          {field.state.meta.errors[0]}
        </p>
      )}
    </div>
  )}
</form.Field>
```

**Select Field Pattern:**

```tsx
<form.Field 
  name="selectField"
  validators={{
    onChange: ({ value }) => 
      !value ? 'Selection is required' : undefined,
  }}
>
  {(field) => (
    <div>
      <Label htmlFor={field.name}>Select Option *</Label>
      <Select 
        value={field.state.value}
        onValueChange={(value) => field.handleChange(value)}
        disabled={isPending}
      >
        <SelectTrigger id={field.name}>
          <SelectValue placeholder="Choose..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
          <SelectItem value="option2">Option 2</SelectItem>
        </SelectContent>
      </Select>
      {field.state.meta.errors.length > 0 && (
        <p className="text-sm text-destructive mt-1">
          {field.state.meta.errors[0]}
        </p>
      )}
    </div>
  )}
</form.Field>
```

**Form Structure:**

```tsx
"use client";

import { useFeatureForm } from './useFeatureForm';
import { FormActions } from './FormActions';

export function FeatureForm() {
  const { form, isPending } = useFeatureForm();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    form.handleSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Field sections */}
      <div className="glass-card p-6 space-y-4">
        <h3 className="text-lg font-semibold">Section Title</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {/* Fields go here */}
        </div>
      </div>

      <FormActions 
        onReset={() => form.reset()}
        isLoading={isPending}
      />
    </form>
  );
}
```

### 3. Form Actions: `FormActions.tsx`

Reusable submit button component with loading states.

```tsx
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface FormActionsProps {
  onReset: () => void
  isLoading?: boolean
}

export function FormActions({ onReset, isLoading = false }: FormActionsProps) {
  return (
    <div className="flex justify-center pt-4">
      <button
        type="submit"
        disabled={isLoading}
        className={cn(
          "btn-neon flex items-center gap-2 px-8 py-4 text-lg",
          isLoading && "opacity-50 cursor-not-allowed"
        )}
      >
        {isLoading ? (
          <>
            <div className="w-5 h-5 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            Submit
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>
    </div>
  )
}
```

### 4. Layout: `layout.tsx`

Server-side auth guards and route protection.

```tsx
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function FeatureLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const session = await auth()
  
  // Redirect unauthenticated users
  if (!session.isAuthenticated) {
    redirect('/')
  }
  
  // Check user role/state
  if (session.sessionClaims?.metadata.role) {
    redirect('/dashboard')
  }

  return <>{children}</>
}
```

### 5. Page: `page.tsx`

Main page component that composes all sections.

```tsx
"use client"

import { FeatureHeader } from "./-components/FeatureHeader"
import { FeatureForm } from "./-components/FeatureForm"
import { FeatureFooter } from "./-components/FeatureFooter"

export default function FeaturePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Background gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-600/15 rounded-full blur-[80px]" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-500/10 rounded-full blur-[80px]" />
      </div>

      {/* Skip link for accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4"
      >
        Skip to main content
      </a>

      {/* Main content */}
      <main id="main-content" className="relative z-10 flex-1 flex flex-col items-center px-6 py-8">
        <div className="w-full max-w-2xl mx-auto">
          <FeatureHeader />
          <FeatureForm />
        </div>
      </main>

      <FeatureFooter />
    </div>
  )
}
```

## Validation Patterns

### Field-Level Validation

TanStack Form supports onChange, onBlur, and onSubmit validators:

```tsx
validators={{
  onChange: ({ value }) => {
    if (!value) return 'Required field';
    if (value.length < 3) return 'Minimum 3 characters';
    return undefined;
  },
  onBlur: ({ value }) => {
    // Validate on blur
    return undefined;
  },
}}
```

### Common Validators

**Required Field:**
```tsx
onChange: ({ value }) => !value ? 'Field is required' : undefined
```

**Numeric Range:**
```tsx
onChange: ({ value }) => {
  if (!value) return undefined; // Optional field
  const num = parseInt(value);
  if (isNaN(num)) return 'Must be a number';
  if (num < 1) return 'Must be greater than 0';
  if (num > 120) return 'Must be less than 120';
  return undefined;
}
```

**Phone Number:**
```tsx
onChange: ({ value }) => {
  if (!value) return 'Phone is required';
  if (!/^\d*$/.test(value)) return 'Only numbers allowed';
  if (value.length < 10) return 'Must be at least 10 digits';
  if (value.length > 10) return 'Must be at most 10 digits';
  return undefined;
}
```

**Year Validation:**
```tsx
onChange: ({ value }) => {
  if (!value) return undefined;
  const year = parseInt(value);
  if (isNaN(year)) return 'Must be a valid year';
  if (year < 1950) return 'Must be after 1950';
  if (year > new Date().getFullYear()) return 'Cannot be in the future';
  return undefined;
}
```

## Advanced Patterns

### Custom Input with Prefix

```tsx
<div className="flex">
  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-secondary/50">
    +57
  </span>
  <Input 
    id={field.name}
    value={field.state.value}
    onChange={(e) => {
      const numericValue = e.target.value.replace(/\D/g, '');
      field.handleChange(numericValue);
    }}
    className="rounded-l-none"
    maxLength={10}
  />
</div>
```

### Numeric-Only Input

```tsx
onChange={(e) => {
  const numericValue = e.target.value.replace(/\D/g, '');
  field.handleChange(numericValue);
}}
```

### Conditional Fields

```tsx
{form.state.values.showOptional && (
  <form.Field name="optionalField">
    {(field) => (
      // Field rendering
    )}
  </form.Field>
)}
```

## Accessibility

This pattern includes several accessibility features:

1. **Skip Links**: Allow keyboard users to bypass navigation
2. **Proper Labels**: All inputs have associated labels with htmlFor
3. **ARIA Attributes**: aria-hidden on decorative elements
4. **Error Messages**: Linked to inputs for screen readers
5. **Focus Management**: Proper focus rings and keyboard navigation
6. **Disabled States**: Clear visual and functional disabled states

## Type Safety

The pattern ensures type safety at multiple levels:

1. **Zod Schema**: Runtime validation and type inference
2. **TanStack Form Types**: Typed form state and values
3. **TypeScript Enums**: Constrained string unions for selects
4. **API Types**: Transform form values to match backend types

## Best Practices

1. **Separate Concerns**: Keep form logic in custom hooks
2. **Field Validation**: Validate on change for immediate feedback
3. **Loading States**: Disable form during submission
4. **Error Display**: Show errors inline near fields
5. **Required Fields**: Mark with asterisk (*) in labels
6. **Accessibility First**: Include skip links and proper ARIA
7. **Type Safety**: Use Zod schemas for validation and types
8. **Modular Components**: Break down into reusable pieces
9. **Server Guards**: Protect routes with layout auth checks
10. **Full Redirects**: Use window.location.href when auth state changes

## Testing Considerations

When testing forms built with this pattern:

1. Test field-level validation
2. Test form submission with valid/invalid data
3. Test loading states and disabled buttons
4. Test error message display
5. Test keyboard navigation
6. Test screen reader compatibility
7. Mock Convex actions in tests

## References

- [TanStack Form Docs](https://tanstack.com/form/latest)
- [Zod Documentation](https://zod.dev)
- [shadcn/ui Components](https://ui.shadcn.com)
- File: `apps/web/src/app/onboarding/-components/useOnboardingForm.ts:1`
- File: `apps/web/src/app/onboarding/-components/OnboardingForm.tsx:1`
