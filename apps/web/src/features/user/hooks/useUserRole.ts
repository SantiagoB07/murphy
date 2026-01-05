"use client"

import { useQuery } from "@tanstack/react-query"
import { convexQuery } from "@convex-dev/react-query"
import { api } from "@murphy/backend/convex/_generated/api"
import type { UserRole } from "../user.types"

interface UseUserRoleReturn {
  role: UserRole | null
  isLoading: boolean
  error: Error | null
}

export function useUserRole(): UseUserRoleReturn {
  const { data, isPending, error } = useQuery(
    convexQuery(api.users.getUserRole, {})
  )

  return {
    role: data ?? null,
    isLoading: isPending,
    error: error ?? null,
  }
}
