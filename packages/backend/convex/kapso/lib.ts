"use node";
import { WhatsAppClient } from '@kapso/whatsapp-cloud-api';
import { internalAction } from '../_generated/server';
export const KAPSO_PHONE_NUMBER_ID = process.env.KAPSO_PHONE_NUMBER_ID || '';


const createWhatsappClient = () => new WhatsAppClient({
  baseUrl: 'https://app.kapso.ai/api/meta/',
  kapsoApiKey: process.env.KAPSO_API_KEY!
});


export async function sendText(to: string, body: string): Promise<void> {
  await createWhatsappClient().messages.sendText({
    phoneNumberId: KAPSO_PHONE_NUMBER_ID,
    to,
    body,
  });
}




export const sendWhatsappMessage = internalAction({
  handler: async (ctx, args: {to: string; body: string}) => {
    await sendText(args.to, args.body);
  }
})
