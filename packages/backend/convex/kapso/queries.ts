import { internalQuery } from "../_generated/server";





export const getPatientFromPhoneNumber = internalQuery({
  handler: async (ctx, args: {phoneNumber: string}) => {
    const patient = await ctx.db
      .query("patientProfiles")
      .withIndex("by_phone_number", (q) => q.eq("phoneNumber", args.phoneNumber))
      .first();

    return patient;
  }
})
