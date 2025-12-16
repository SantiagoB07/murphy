# Agent Guidelines for Murphy

## Commands
- **Dev**: `pnpm dev` (all) | `pnpm dev:web` (frontend) | `pnpm dev:server` (backend)
- **Build**: `pnpm build` | `pnpm check-types`
- **Testing**: Not configured yet
- **First-time setup**: `pnpm install && pnpm dev:setup`

## Tech Stack
Next.js 16 App Router + React 19 + TypeScript (strict) + Convex + Clerk + TanStack Form + Zod + Tailwind CSS v4 + shadcn/ui

## Code Style
- **Imports**: React core → third-party (alphabetical) → UI components → hooks/utils → relative imports
- **Types**: Prefer `interface` for props/APIs, `type` for Zod inference and unions. No enums - use union types
- **Naming**: PascalCase (components), camelCase (variables/functions/files), prefix booleans with `is/has/should`
- **Formatting**: 2 spaces, double quotes, no semicolons (frontend), with semicolons (backend), trailing commas
- **Client Components**: Mark all interactive components with `"use client"` directive
- **Error Handling**: Try-catch with `console.error`, throw to caller, display inline errors below form fields

## Form Pattern (TanStack Form - see docs/form-pattern.md)
1. Create `useFeatureForm.ts` hook: define Zod schema, initialize `useForm`, handle submission with loading states
2. Use `form.Field` with `validators.onChange` for inline validation
3. Display errors below each field, disable inputs during submission (`isPending` state)

## Styling
- Tailwind v4 with custom design system in `src/index.css` (Apple HIG-inspired, dark purple theme)
- Use `cn()` utility for conditional classes: `cn("base", condition && "conditional", className)`
- Custom classes: `.glass-card`, `.btn-neon`, `.focus-ring`, `.elevation-{0-3}`, `.animate-fade-up`
- Accessibility: proper labels (`htmlFor`), ARIA attributes, focus states, reduced motion support

## Backend (Convex)
- **Query**: Real-time data reads | **Mutation**: Database writes | **Action**: Server-side logic + external API calls
- Use `internalMutation` for internal-only mutations, validate args with convex validation utilities `import { v } from "convex/values";`
- Auth: `const user = await ctx.auth.getUserIdentity(); if (!user) throw new Error("Not authenticated")`
