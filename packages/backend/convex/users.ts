import { query, internalMutation, action } from "./_generated/server"
import { internal } from "./_generated/api"
import { v } from "convex/values"
import { createClerkClient } from "@clerk/backend"

const diabetesTypes = v.union(
  v.literal("Tipo 1"),
  v.literal("Tipo 2"),
  v.literal("Gestacional"),
  v.literal("LADA"),
  v.literal("MODY")
)

const genderTypes = v.union(
  v.literal("masculino"),
  v.literal("femenino"),
  v.literal("otro"),
  v.literal("prefiero_no_decir")
)

const payloadUserProfile = v.object({
  fullName: v.string(),
  phoneNumber: v.string(),
  age: v.number(),
  gender: genderTypes,
  diabetesType: diabetesTypes,
  diagnosisYear: v.optional(v.number()),
  city: v.optional(v.string()),
  estrato: v.optional(v.number()),
})

export const createUser = internalMutation({
  args: payloadUserProfile.extend({
    clerkUserId: v.string()
  }),
  handler: async (ctx, args) => {
    const patientId = await ctx.db.insert("patientProfiles", {
      ...args,
    })

    // Initialize default notification preferences for new patient
    await ctx.runMutation(internal.notificationPreferences.initialize, {
      clerkUserId: args.clerkUserId
    })

    return patientId
  }
})

export const onboardUser = action({
  args: payloadUserProfile,
  handler: async (ctx, args) => {
    const user = await ctx.auth.getUserIdentity()
    if (!user) {
      throw new Error("User not authenticated")
    }

    const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })

    await clerkClient.users.updateUser(user.subject, {
      publicMetadata: {
        role: "patient"
      }
    })

    await ctx.runMutation(internal.users.createUser, {
      ...args,
      clerkUserId: user.subject
    })
  }
})
