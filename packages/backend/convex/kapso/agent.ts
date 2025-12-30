import z from "zod";
import { internalAction } from "../_generated/server";

import { components, internal } from "../_generated/api";
import { whatsappMessageReceivedSchema } from "./schema";


type WhatsappMessageReceivedSchema = z.infer<typeof whatsappMessageReceivedSchema>;

const GEMINI_APIK_KEY = process.env.GEMINI_APIK_KEY || ""

import { Agent, createThread } from "@convex-dev/agent";
import { openai } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google"

const google = createGoogleGenerativeAI({
  apiKey: GEMINI_APIK_KEY,
})

const model = google("gemini-3-flash-preview")

export const agent = new Agent(components.agent, {
  name: "My Agent",
  instructions: "You are murphy, an AI assistant.",
  languageModel: model,
});



export const handleKapsoWhatsappMessage = internalAction({
  handler: async (ctx, args: WhatsappMessageReceivedSchema) => {

    const threadId = await createThread(ctx, components.agent);
    const prompt = args.message.text?.body || ""
    const result = await agent.generateText(ctx, { threadId }, { prompt });




    await ctx.runAction(internal.kapso.lib.sendWhatsappMessage, {
      to: args.message.from,
      body: result.text || "Sorry, I couldn't process your message.",
    })

  }
})
