import z from "zod";
import { internalAction } from "../_generated/server";

import { internal } from "../_generated/api";
import { whatsappMessageReceivedSchema } from "./schema";


type WhatsappMessageReceivedSchema = z.infer<typeof whatsappMessageReceivedSchema>;


export const handleKapsoWhatsappMessage = internalAction({
  handler: async (ctx, args: WhatsappMessageReceivedSchema) => {

    await ctx.runAction(internal.kapso.lib.sendWhatsappMessage, {
      to: args.message.from,
      body: args.message.text?.body || "Echo"
    })

  }
})
