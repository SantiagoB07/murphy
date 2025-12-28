import { query, mutation, action, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { createClerkClient } from "@clerk/backend";
import { getCurrentPatient } from "./lib/auth";

// ============================================
// Queries
// ============================================

const PROD_URL = process.env.PROD_URL

/**
 * Gets the current coadmin's profile and linked patient info
 */
export const getCurrentCoadminProfile = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const coadmin = await ctx.db
      .query("coadminProfiles")
      .withIndex("by_clerk_user", (q) => q.eq("clerkUserId", identity.subject))
      .unique();

    if (!coadmin) {
      return null;
    }

    const patient = await ctx.db.get(coadmin.patientId);
    return {
      ...coadmin,
      patient: patient ? {
        _id: patient._id,
        fullName: patient.fullName,
        diabetesType: patient.diabetesType,
      } : null,
    };
  },
});

/**
 * Gets all coadmins for the current patient
 */
export const getPatientCoadmins = query({
  args: {},
  handler: async (ctx) => {
    const patient = await getCurrentPatient(ctx);

    const coadmins = await ctx.db
      .query("coadminProfiles")
      .withIndex("by_patient", (q) => q.eq("patientId", patient._id))
      .collect();

    return coadmins;
  },
});

/**
 * Gets pending invitations for the current patient
 * Note: This requires calling Clerk API, so it's an action
 */
export const getPendingInvitations = action({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

    // Get all pending invitations
    const invitations = await clerkClient.invitations.getInvitationList({
      status: "pending",
    });

    // Filter to only show invitations created by this patient
    const patientInvitations = invitations.data.filter(
      (inv) => inv.publicMetadata?.invitedByClerkUserId === identity.subject
    );

    return patientInvitations.map((inv) => ({
      id: inv.id,
      emailAddress: inv.emailAddress,
      status: inv.status,
      createdAt: inv.createdAt,
      expiresAt: inv.createdAt + 30 * 24 * 60 * 60 * 1000, // 30 days
    }));
  },
});

// ============================================
// Mutations
// ============================================

/**
 * Internal mutation to create a coadmin profile
 */
export const createCoadminProfile = internalMutation({
  args: {
    clerkUserId: v.string(),
    patientId: v.id("patientProfiles"),
    fullName: v.string(),
    phoneNumber: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if coadmin profile already exists
    const existing = await ctx.db
      .query("coadminProfiles")
      .withIndex("by_clerk_user", (q) => q.eq("clerkUserId", args.clerkUserId))
      .unique();

    if (existing) {
      throw new Error("Coadmin profile already exists");
    }

    // Verify patient exists
    const patient = await ctx.db.get(args.patientId);
    if (!patient) {
      throw new Error("Patient not found");
    }

    const coadminId = await ctx.db.insert("coadminProfiles", {
      clerkUserId: args.clerkUserId,
      patientId: args.patientId,
      fullName: args.fullName,
      phoneNumber: args.phoneNumber,
      updatedAt: Date.now(),
    });

    return coadminId;
  },
});

/**
 * Revokes a coadmin's access to the patient's data
 */
export const revokeCoadminAccess = mutation({
  args: {
    coadminId: v.id("coadminProfiles"),
  },
  handler: async (ctx, args) => {
    const patient = await getCurrentPatient(ctx);

    const coadmin = await ctx.db.get(args.coadminId);
    if (!coadmin) {
      throw new Error("Coadmin not found");
    }

    // Verify the coadmin belongs to this patient
    if (coadmin.patientId !== patient._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.delete(args.coadminId);
    return { success: true };
  },
});

// ============================================
// Actions (External API calls)
// ============================================

/**
 * Sends an invitation to a new coadmin
 * Uses Clerk's invitation API with metadata
 */
export const inviteCoadmin = action({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get the patient's profile to include in metadata
    const patient = await ctx.runQuery(internal.coadmins.getPatientForInvitation, {
      clerkUserId: identity.subject,
    });

    if (!patient) {
      throw new Error("Patient profile not found");
    }

    const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

    // Check if there's already a pending invitation for this email
    const existingInvitations = await clerkClient.invitations.getInvitationList({
      status: "pending",
    });

    const existingForEmail = existingInvitations.data.find(
      (inv) =>
        inv.emailAddress === args.email &&
        inv.publicMetadata?.invitedByClerkUserId === identity.subject
    );

    if (existingForEmail) {
      throw new Error("Ya existe una invitación pendiente para este correo");
    }

    // Check if there's already a coadmin with this email for this patient
    const existingUsers = await clerkClient.users.getUserList({
      emailAddress: [args.email],
    });

    if (existingUsers.data.length > 0) {
      const existingUser = existingUsers.data[0];
      // Check if this user is already a coadmin for this patient
      const existingCoadmin = await ctx.runQuery(internal.coadmins.getCoadminByClerkUserId, {
        clerkUserId: existingUser.id,
        patientId: patient._id,
      });

      if (existingCoadmin) {
        throw new Error("Este usuario ya es coadministrador de tu cuenta");
      }
    }

    console.log("Creating invitation for coadmin:", args.email);
    console.log("Invited by patient ID:", patient._id);
    console.log("Patient name:", patient.fullName);
    console.log("Redirect URL:", `${PROD_URL || "http://localhost:3000"}/sign-in`);

    // Create the invitation with metadata
    const invitation = await clerkClient.invitations.createInvitation({
      emailAddress: args.email,
      publicMetadata: {
        intendedRole: "coadmin",
        invitedByPatientId: patient._id,
        invitedByClerkUserId: identity.subject,
        invitedByPatientName: patient.fullName || "Paciente",
      },
      redirectUrl: `${PROD_URL || "http://localhost:3000"}/sign-in`,
    });

    console.log("invitation", invitation)

    return {
      success: true,
      invitationId: invitation.id,
    };
  },
});

/**
 * Revokes a pending invitation
 */
export const revokeInvitation = action({
  args: {
    invitationId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

    // Get pending invitations and verify this one belongs to the patient
    const invitations = await clerkClient.invitations.getInvitationList({
      status: "pending",
    });

    const invitation = invitations.data.find((inv) => inv.id === args.invitationId);

    if (!invitation) {
      throw new Error("Invitation not found");
    }

    if (invitation.publicMetadata?.invitedByClerkUserId !== identity.subject) {
      throw new Error("Unauthorized");
    }

    await clerkClient.invitations.revokeInvitation(args.invitationId);

    return { success: true };
  },
});

/**
 * Onboards a new coadmin after they accept an invitation
 */
export const onboardCoadmin = action({
  args: {
    fullName: v.string(),
    phoneNumber: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

    // Get the user to check invitation metadata
    const user = await clerkClient.users.getUser(identity.subject);
    const publicMetadata = user.publicMetadata as {
      intendedRole?: string;
      invitedByPatientId?: string;
      role?: string;
    };

    // Check if user was invited as a coadmin
    if (publicMetadata.intendedRole !== "coadmin" || !publicMetadata.invitedByPatientId) {
      throw new Error("Invalid invitation. Please use a valid coadmin invitation link.");
    }

    // Create the coadmin profile
    await ctx.runMutation(internal.coadmins.createCoadminProfile, {
      clerkUserId: identity.subject,
      patientId: publicMetadata.invitedByPatientId as any,
      fullName: args.fullName,
      phoneNumber: args.phoneNumber,
    });

    // Update Clerk user metadata to mark as coadmin
    await clerkClient.users.updateUser(identity.subject, {
      publicMetadata: {
        role: "coadmin",
        patientId: publicMetadata.invitedByPatientId,
      },
    });

    return { success: true };
  },
});

// ============================================
// Internal Queries (for use in actions)
// ============================================

import { internalQuery } from "./_generated/server";

/**
 * Internal query to get patient info for invitation
 */
export const getPatientForInvitation = internalQuery({
  args: {
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const patient = await ctx.db
      .query("patientProfiles")
      .withIndex("by_clerk_user", (q) => q.eq("clerkUserId", args.clerkUserId))
      .unique();

    return patient;
  },
});

/**
 * Internal query to check if a coadmin already exists for a patient
 */
export const getCoadminByClerkUserId = internalQuery({
  args: {
    clerkUserId: v.string(),
    patientId: v.id("patientProfiles"),
  },
  handler: async (ctx, args) => {
    const coadmin = await ctx.db
      .query("coadminProfiles")
      .withIndex("by_clerk_user", (q) => q.eq("clerkUserId", args.clerkUserId))
      .unique();

    if (coadmin && coadmin.patientId === args.patientId) {
      return coadmin;
    }

    return null;
  },
});

