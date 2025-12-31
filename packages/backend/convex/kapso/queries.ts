import { v } from "convex/values";
import { internalQuery } from "../_generated/server";

export const getPatientFromPhoneNumber = internalQuery({
  args: { phoneNumber: v.string() },
  handler: async (ctx, args) => {
    const patient = await ctx.db
      .query("patientProfiles")
      .withIndex("by_phone_number", (q) => q.eq("phoneNumber", args.phoneNumber))
      .first();

    return patient;
  }
})
