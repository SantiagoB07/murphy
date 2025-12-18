import { internalMutation, action } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { createClerkClient } from "@clerk/backend";
import { diabetesTypes, genderTypes } from "./lib/validators";
import * as Notifications from "./model/notifications";

export const createUser = internalMutation({
  args: {
    clerkUserId: v.string(),
    fullName: v.string(),
    phoneNumber: v.string(),
    age: v.number(),
    gender: genderTypes,
    diabetesType: diabetesTypes,
    diagnosisYear: v.optional(v.number()),
    city: v.optional(v.string()),
    estrato: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const patientId = await ctx.db.insert("patientProfiles", {
      ...args,
    });

    // Initialize default notification preferences for new patient
    // Using model helper directly instead of ctx.runMutation
    await Notifications.initializePreferences(ctx, args.clerkUserId);

    return patientId;
  },
});

export const onboardUser = action({
  args: {
    fullName: v.string(),
    phoneNumber: v.string(),
    age: v.number(),
    gender: genderTypes,
    diabetesType: diabetesTypes,
    diagnosisYear: v.optional(v.number()),
    city: v.optional(v.string()),
    estrato: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity();
    if (!user) {
      throw new Error("User not authenticated");
    }

    const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

    await clerkClient.users.updateUser(user.subject, {
      publicMetadata: {
        role: "patient",
      },
    });

    await ctx.runMutation(internal.users.createUser, {
      ...args,
      clerkUserId: user.subject,
    });
  },
});
