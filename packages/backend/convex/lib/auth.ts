import type { QueryCtx, MutationCtx } from "../_generated/server"
import type { Id } from "../_generated/dataModel"

/**
 * Gets the current authenticated patient profile
 * Throws an error if not authenticated or profile not found
 */
export async function getCurrentPatient(
  ctx: QueryCtx | MutationCtx
): Promise<{ _id: Id<"patientProfiles">, clerkUserId: string }> {
  const identity = await ctx.auth.getUserIdentity()
  
  if (!identity) {
    throw new Error("Not authenticated")
  }

  const patient = await ctx.db
    .query("patientProfiles")
    .withIndex("by_clerk_user", (q) => q.eq("clerkUserId", identity.subject))
    .unique()

  if (!patient) {
    throw new Error("Patient profile not found")
  }

  return patient
}

/**
 * Gets the current authenticated patient profile or returns null
 * Use this when you want to handle missing profiles gracefully
 */
export async function getCurrentPatientOrNull(
  ctx: QueryCtx | MutationCtx
): Promise<{ _id: Id<"patientProfiles">, clerkUserId: string } | null> {
  const identity = await ctx.auth.getUserIdentity()
  
  if (!identity) {
    return null
  }

  const patient = await ctx.db
    .query("patientProfiles")
    .withIndex("by_clerk_user", (q) => q.eq("clerkUserId", identity.subject))
    .unique()

  return patient
}
