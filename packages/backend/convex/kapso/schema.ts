import z from "zod";
/* 
Explample payload for "whatsapp.message.received" event:

{
message: {
    id: 'wamid.TEST_yHAWOMudsRSLBJZ27v9nFVTLQWhhTw',
    timestamp: '1767111113',
    type: 'text',
    text: {
      body: 'This is a test message from Kapso webhook testing'
    },
    from: '+573027842717',
    kapso: {
      direction: 'inbound',
      status: 'received',
      processing_status: 'pending',
      origin: 'cloud_api',
      has_media: false
    }
  },
  conversation: {
    id: 'test-conv-4dd8a015af577a89',
    phone_number: '+57 302 7842717',
    status: 'active',
    last_active_at: '2025-12-30T13:11:53-03:00',
    created_at: '2025-12-30T12:11:53-03:00',
    updated_at: '2025-12-30T13:11:53-03:00',
    metadata: {},
    phone_number_id: '825266384004171',
    kapso: {
      messages_count: 0
    }
  },
  is_new_conversation: false,
  phone_number_id: '825266384004171',
  test: true,
  test_timestamp: '2025-12-30T13:11:53-03:00'
} */

export const whatsappMessageReceivedSchema = z.object({
  message: z.object({
    id: z.string(),
    timestamp: z.string(),
    type: z.string(),
    text: z.object({
      body: z.string()
    }).optional(),
    from: z.string(),
    kapso: z.object({
      direction: z.string(),
      status: z.string(),
      processing_status: z.string(),
      origin: z.string(),
      has_media: z.boolean()
    })
  }),
  conversation: z.object({
    id: z.string(),
    phone_number: z.string(),
    status: z.string(),
    last_active_at: z.string(),
    created_at: z.string(),
    updated_at: z.string(),
    metadata: z.any(),
    phone_number_id: z.string(),
    kapso: z.object({
      messages_count: z.number()
    })
  }),
  is_new_conversation: z.boolean(),
  phone_number_id: z.string(),
  test: z.boolean().optional(),
  test_timestamp: z.string().optional()
})


