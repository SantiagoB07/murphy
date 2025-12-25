import type { QueryCtx, MutationCtx } from "../_generated/server"
import type { Id, Doc } from "../_generated/dataModel"

export type UserRole = "patient" | "coadmin"

export type AuthenticatedUser = {
  clerkUserId: string
  role: UserRole
  patientId: Id<"patientProfiles">
}

/**
 * Gets the current authenticated user's role and associated patient ID.
 * Works for both patients (who own their own data) and coadmins (who access a patient's data).
 * 
 * @returns AuthenticatedUser with role and patientId
 * @throws Error if not authenticated or no profile found
 */
export async function getAuthenticatedUser(
  ctx: QueryCtx | MutationCtx
): Promise<AuthenticatedUser> {
  const identity = await ctx.auth.getUserIdentity()
  
  if (!identity) {
    throw new Error("Not authenticated")
  }

  // First, check if user is a patient
  const patient = await ctx.db
    .query("patientProfiles")
    .withIndex("by_clerk_user", (q) => q.eq("clerkUserId", identity.subject))
    .unique()

  if (patient) {
    return {
      clerkUserId: identity.subject,
      role: "patient",
      patientId: patient._id,
    }
  }

  // If not a patient, check if user is a coadmin
  const coadmin = await ctx.db
    .query("coadminProfiles")
    .withIndex("by_clerk_user", (q) => q.eq("clerkUserId", identity.subject))
    .unique()

  if (coadmin) {
    return {
      clerkUserId: identity.subject,
      role: "coadmin",
      patientId: coadmin.patientId,
    }
  }

  throw new Error("User profile not found")
}

/**
 * Gets the current authenticated user's role and associated patient ID, or null if not found.
 * Works for both patients and coadmins.
 */
export async function getAuthenticatedUserOrNull(
  ctx: QueryCtx | MutationCtx
): Promise<AuthenticatedUser | null> {
  const identity = await ctx.auth.getUserIdentity()
  
  if (!identity) {
    return null
  }

  // First, check if user is a patient
  const patient = await ctx.db
    .query("patientProfiles")
    .withIndex("by_clerk_user", (q) => q.eq("clerkUserId", identity.subject))
    .unique()

  if (patient) {
    return {
      clerkUserId: identity.subject,
      role: "patient",
      patientId: patient._id,
    }
  }

  // If not a patient, check if user is a coadmin
  const coadmin = await ctx.db
    .query("coadminProfiles")
    .withIndex("by_clerk_user", (q) => q.eq("clerkUserId", identity.subject))
    .unique()

  if (coadmin) {
    return {
      clerkUserId: identity.subject,
      role: "coadmin",
      patientId: coadmin.patientId,
    }
  }

  return null
}

/**
 * Gets the patient ID for the current user (works for both patients and coadmins).
 * This is the primary helper for data access - all records are keyed by patientId.
 * 
 * @returns The patient ID to use for data queries
 * @throws Error if not authenticated or no profile found
 */
export async function getActivePatientId(
  ctx: QueryCtx | MutationCtx
): Promise<Id<"patientProfiles">> {
  const user = await getAuthenticatedUser(ctx)
  return user.patientId
}

/**
 * Gets the current authenticated patient profile.
 * This function works for BOTH patients and coadmins:
 * - For patients: returns their own patient profile
 * - For coadmins: returns the linked patient's profile
 * 
 * @throws Error if not authenticated or profile not found
 */
export async function getCurrentPatient(
  ctx: QueryCtx | MutationCtx
): Promise<Doc<"patientProfiles"> & { _id: Id<"patientProfiles"> }> {
  const user = await getAuthenticatedUser(ctx)

  const patient = await ctx.db.get(user.patientId)
  
  if (!patient) {
    throw new Error("Patient profile not found")
  }

  return patient
}

/**
 * Gets the current authenticated patient profile or returns null.
 * Use this when you want to handle missing profiles gracefully.
 * Works for both patients and coadmins.
 */
export async function getCurrentPatientOrNull(
  ctx: QueryCtx | MutationCtx
): Promise<(Doc<"patientProfiles"> & { _id: Id<"patientProfiles"> }) | null> {
  const user = await getAuthenticatedUserOrNull(ctx)
  
  if (!user) {
    return null
  }

  const patient = await ctx.db.get(user.patientId)
  return patient
}

/**
 * Checks if the current user is a patient (not a coadmin).
 * Useful for operations that should only be available to the patient themselves.
 */
export async function isCurrentUserPatient(
  ctx: QueryCtx | MutationCtx
): Promise<boolean> {
  const user = await getAuthenticatedUserOrNull(ctx)
  return user?.role === "patient"
}

/**
 * Requires that the current user is a patient (not a coadmin).
 * Throws an error if the user is a coadmin or not authenticated.
 * Use this for operations that should only be available to patients.
 */
export async function requirePatientRole(
  ctx: QueryCtx | MutationCtx
): Promise<AuthenticatedUser & { role: "patient" }> {
  const user = await getAuthenticatedUser(ctx)
  
  if (user.role !== "patient") {
    throw new Error("This operation is only available to patients")
  }

  return user as AuthenticatedUser & { role: "patient" }
}
