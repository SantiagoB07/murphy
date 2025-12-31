"use node";
import { v } from "convex/values";
import { WhatsAppClient } from '@kapso/whatsapp-cloud-api';
import { internalAction } from '../_generated/server';

const KAPSO_PHONE_NUMBER_ID = process.env.KAPSO_PHONE_NUMBER_ID || '';

const createWhatsappClient = () => new WhatsAppClient({
  baseUrl: 'https://app.kapso.ai/api/meta/',
  kapsoApiKey: process.env.KAPSO_API_KEY!
});

async function sendText(to: string, body: string): Promise<void> {
  await createWhatsappClient().messages.sendText({
    phoneNumberId: KAPSO_PHONE_NUMBER_ID,
    to,
    body,
  });
}

export const sendWhatsappMessage = internalAction({
  args: { to: v.string(), body: v.string() },
  handler: async (ctx, args) => {
    await sendText(args.to, args.body);
  }
})
