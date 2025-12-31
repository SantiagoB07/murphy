# Kapso Documentation

## Docs

- [Get business profile](https://docs.kapso.ai/api/meta/whatsapp/business-profile/get-business-profile.md): Retrieve the WhatsApp Business profile information. WhatsApp users can view your business profile by clicking your business's name or number in a WhatsApp message thread.

**Proxy endpoint**: Proxies directly to Meta Graph API.

- [Update business profile](https://docs.kapso.ai/api/meta/whatsapp/business-profile/update-business-profile.md): Update WhatsApp business profile information.

**Proxy endpoint**: Proxies directly to Meta Graph API /PHONE_NUMBER_ID/whatsapp_business_profile.

Use this endpoint to update:
- About text (1-139 characters, appears below profile image)
- Business address and description
- Contact email
- Profile picture (via handle from resumable upload)
- Business category (vertical)
- Website links (max 2)

**Restrictions**:
- About text: 1-139 chars, rendered emojis supported, hyperlinks won't be clickable, no markdown
- Address: max 256 characters
- Description: max 512 characters
- Email: max 128 characters, valid email format
- Websites: max 2 URLs, max 256 chars each, must include http:// or https://

**Note**: Sandbox configurations are blocked (returns 403).

- [Get call permission state](https://docs.kapso.ai/api/meta/whatsapp/calls/get-call-permission-state.md): Get the call permission state for a business phone number with a specific WhatsApp user.

**Proxy endpoint**: Proxies directly to Meta Graph API.

Returns the current permission status and available actions with their limits. Permission can be:
- **no_permission**: No calling permission granted
- **temporary**: Temporary permission with expiration time

Actions include:
- **send_call_permission_request**: Send permission request message
- **start_call**: Initiate a call

Each action has time-based limits (e.g., max 2 permission requests per 24 hours).

- [List calls](https://docs.kapso.ai/api/meta/whatsapp/calls/list-calls.md): Retrieve a paginated list of WhatsApp voice calls.

**Kapso Extension**: This endpoint returns call records stored in Kapso's database, not Meta's API.

Supports filtering by direction, status, and time range. Uses cursor-based pagination.

- [Perform call action](https://docs.kapso.ai/api/meta/whatsapp/calls/perform-call-action.md): Perform various call actions via the WhatsApp Calling API.

**Proxy endpoint**: Proxies directly to Meta Graph API.

Supports the following actions:
- **connect**: Initiate an outbound call to a WhatsApp user
- **pre_accept**: Pre-establish WebRTC connection before accepting call
- **accept**: Accept an inbound call from a WhatsApp user
- **reject**: Reject an inbound call
- **terminate**: End an active call

- [Get contact details](https://docs.kapso.ai/api/meta/whatsapp/contacts/get-contact-details.md): Retrieve detailed information about a specific contact.
- [List contacts](https://docs.kapso.ai/api/meta/whatsapp/contacts/list-contacts.md): Retrieve a paginated list of WhatsApp contacts for your project.

Supports filtering by WhatsApp ID, customer association, and more.

- [Get conversation details](https://docs.kapso.ai/api/meta/whatsapp/conversations/get-conversation-details.md): Retrieve detailed information about a specific conversation.

## Kapso Extensions

The response includes:
- Full contact information
- Message statistics
- Conversation metadata

- [List conversations](https://docs.kapso.ai/api/meta/whatsapp/conversations/list-conversations.md): Retrieve a paginated list of WhatsApp conversations for a phone number.

Conversations are ordered by last activity (most recent first).
Supports filtering by status, activity time range, and phone number.

## Kapso Extensions

The response includes Kapso-specific conversation metadata:
- Message counts (total and unread)
- Associated contact information
- Conversation status and timestamps

- [Create flow](https://docs.kapso.ai/api/meta/whatsapp/flows/create-flow.md): Create a new WhatsApp Flow.

**Proxy endpoint**: Proxies directly to Meta Graph API.

- [Create flow (phone number scoped)](https://docs.kapso.ai/api/meta/whatsapp/flows/create-flow-phone-number-scoped.md): Create a new WhatsApp Flow for a phone number.

**Proxy endpoint**: Proxies directly to Meta Graph API.

**Note**: Requires WhatsappConfig with matching phone_number_id.

- [Delete flow](https://docs.kapso.ai/api/meta/whatsapp/flows/delete-flow.md): Delete a draft flow. This action is not reversible.

**Only DRAFT flows can be deleted.** Published flows cannot be deleted but can be deprecated.

**Proxy endpoint**: Proxies directly to Meta Graph API.

**Note**: This endpoint uses the `/flows/` prefix. It is an alias provided for better developer experience.

- [Deprecate flow](https://docs.kapso.ai/api/meta/whatsapp/flows/deprecate-flow.md): Deprecate a published flow.

**Proxy endpoint**: Proxies directly to Meta Graph API.

- [Get flow assets](https://docs.kapso.ai/api/meta/whatsapp/flows/get-flow-assets.md): Get flow JSON assets and URLs.

**Proxy endpoint**: Proxies directly to Meta Graph API.

- [Get flow details](https://docs.kapso.ai/api/meta/whatsapp/flows/get-flow-details.md): Retrieve detailed information about a specific flow.

By default returns: id, name, status, categories, validation_errors.

Use `fields` parameter to request additional information like preview URLs, health status, metrics, etc.

**Proxy endpoint**: Proxies directly to Meta Graph API.

- [List flows](https://docs.kapso.ai/api/meta/whatsapp/flows/list-flows.md): List all WhatsApp Flows for a business account.

**Proxy endpoint**: Proxies directly to Meta Graph API.

- [List flows (phone number scoped)](https://docs.kapso.ai/api/meta/whatsapp/flows/list-flows-phone-number-scoped.md): List all WhatsApp Flows for a phone number.

**Proxy endpoint**: Proxies directly to Meta Graph API.

**Note**: Requires WhatsappConfig with matching phone_number_id.

- [Publish flow](https://docs.kapso.ai/api/meta/whatsapp/flows/publish-flow.md): Publish a flow. This action is not reversible.

Once published, the flow and its assets become immutable.

**Proxy endpoint**: Proxies directly to Meta Graph API.

- [Update flow metadata](https://docs.kapso.ai/api/meta/whatsapp/flows/update-flow-metadata.md): Update flow name, categories, endpoint_uri, or application_id.

**Proxy endpoint**: Proxies directly to Meta Graph API.

- [Upload flow JSON](https://docs.kapso.ai/api/meta/whatsapp/flows/upload-flow-json.md): Upload or update flow JSON definition. The file must be attached as multipart/form-data.

Returns validation errors in the Flow JSON, if any.

**Proxy endpoint**: Proxies directly to Meta Graph API.

- [Delete media](https://docs.kapso.ai/api/meta/whatsapp/media/delete-media.md): Delete a media file from WhatsApp.

You can optionally provide `phone_number_id` query parameter to verify the media belongs to that phone number before deletion.

- [Get media URL](https://docs.kapso.ai/api/meta/whatsapp/media/get-media-url.md): Retrieve the download URL for a media file.

**Important:** The returned URL is temporary and expires after 5 minutes.

- [Upload media](https://docs.kapso.ai/api/meta/whatsapp/media/upload-media.md): Upload media files to WhatsApp. The media ID returned can be used when sending messages.

**Supported formats and size limits:**

**Images** (jpeg, png)
- Max size: 5MB

**Videos** (mp4, 3gp)
- Max size: 16MB

**Audio** (aac, mp3, ogg, opus)
- Max size: 16MB

**Documents** (pdf, doc, docx, ppt, pptx, xls, xlsx)
- Max size: 100MB

**Stickers** (webp)
- Static: max 100KB
- Animated: max 500KB

- [List messages](https://docs.kapso.ai/api/meta/whatsapp/messages/list-messages.md): Retrieve a paginated list of WhatsApp messages for a phone number.

Supports filtering by conversation, direction, status, and time range.
Uses cursor-based pagination for efficient scrolling through large result sets.

- [Send a message](https://docs.kapso.ai/api/meta/whatsapp/messages/send-a-message.md): Send a WhatsApp message to a recipient.

Supports all WhatsApp message types:
- **text**: Plain text messages with optional URL preview
- **image**: Images with optional caption
- **video**: Videos with optional caption
- **audio**: Audio files
- **document**: Documents with optional caption and filename
- **sticker**: Stickers
- **location**: Location sharing
- **contacts**: Contact cards
- **interactive**: Interactive messages (buttons, lists, flows)
- **template**: Message templates
- **reaction**: Emoji reactions to messages

- [Get phone number details](https://docs.kapso.ai/api/meta/whatsapp/phone-numbers/get-phone-number-details.md): Retrieve detailed information about a specific phone number.

By default returns basic information. Use `fields` parameter to request additional data like throughput limits, account mode, certificate status, etc.

**Proxy endpoint**: Proxies directly to Meta Graph API.

- [List phone numbers](https://docs.kapso.ai/api/meta/whatsapp/phone-numbers/list-phone-numbers.md): List all phone numbers associated with a business account.

Returns basic phone number information including verification status and quality rating.

**Proxy endpoint**: Proxies directly to Meta Graph API.

- [Update phone number settings](https://docs.kapso.ai/api/meta/whatsapp/phone-numbers/update-phone-number-settings.md): Update phone number settings. Common use case is updating the two-step verification PIN.

**Proxy endpoint**: Proxies directly to Meta Graph API.

**Note**: Two-step verification is required for WhatsApp Business API. The PIN must be 6 digits.

- [Create message template](https://docs.kapso.ai/api/meta/whatsapp/templates/create-message-template.md): Create a new WhatsApp message template.

Templates must be approved by WhatsApp before they can be used.
After creation, templates enter a PENDING state until reviewed.

**Side effect**: Enqueues a template sync job on success.

- [Delete message template](https://docs.kapso.ai/api/meta/whatsapp/templates/delete-message-template.md): Delete a WhatsApp message template.

**Specify either `name` or `hsm_id` to identify the template to delete.**

- [List message templates](https://docs.kapso.ai/api/meta/whatsapp/templates/list-message-templates.md): Retrieve a list of approved message templates for this phone number.

Templates must be approved by WhatsApp before they can be used.

- [API Introduction](https://docs.kapso.ai/api/meta/whatsapp/whatsapp-introduction.md): Getting started with the Kapso WhatsApp API
- [Add recipients](https://docs.kapso.ai/api/platform/v1/broadcasts/add-recipients.md): Add up to 1000 recipients to a draft broadcast. Duplicates are skipped.

Recipients use Meta's component syntax with body, header, and button components.

- [Create broadcast](https://docs.kapso.ai/api/platform/v1/broadcasts/create-broadcast.md): Create a broadcast campaign in draft mode.

Workflow: create broadcast → add recipients → send. Broadcasts stay in draft until you call the send endpoint.

- [Get broadcast](https://docs.kapso.ai/api/platform/v1/broadcasts/get-broadcast.md)
- [List broadcasts](https://docs.kapso.ai/api/platform/v1/broadcasts/list-broadcasts.md): Get broadcast campaigns, most recent first.
- [List recipients](https://docs.kapso.ai/api/platform/v1/broadcasts/list-recipients.md): Get recipients for this broadcast with delivery status.
- [Send broadcast](https://docs.kapso.ai/api/platform/v1/broadcasts/send-broadcast.md): Start sending messages to all recipients. This is asynchronous - use GET /broadcasts/{id} to monitor progress.
- [Update conversation status](https://docs.kapso.ai/api/platform/v1/conversations/update-conversation-status.md): Close completed conversations or reopen them for follow-ups.
- [Create customer](https://docs.kapso.ai/api/platform/v1/customers/create-customer.md)
- [Delete customer](https://docs.kapso.ai/api/platform/v1/customers/delete-customer.md)
- [Get customer](https://docs.kapso.ai/api/platform/v1/customers/get-customer.md)
- [List customers](https://docs.kapso.ai/api/platform/v1/customers/list-customers.md): Returns customers in your project, most recent first.
- [Update customer](https://docs.kapso.ai/api/platform/v1/customers/update-customer.md)
- [List display name requests](https://docs.kapso.ai/api/platform/v1/display-names/list-display-name-requests.md): View all display name change requests for this number, most recent first.
- [Retrieve display name request](https://docs.kapso.ai/api/platform/v1/display-names/retrieve-display-name-request.md): Check status of a display name change request. Poll this endpoint to monitor Meta's review progress.
- [Submit display name request](https://docs.kapso.ai/api/platform/v1/display-names/submit-display-name-request.md): Request a display name change. Meta reviews most changes within 24-48 hours. Some names may be approved instantly.

- [Create function](https://docs.kapso.ai/api/platform/v1/functions/functions/create-function.md): Create a new serverless function in draft status. The function will be saved but not deployed to the runtime platform.

After creating a function:
1. Review and test the code locally
2. Deploy using POST /functions/{id}/deploy
3. Invoke using POST /functions/{id}/invoke

Choose function_type based on your deployment requirements:
- `cloudflare_worker`: Fast global edge deployment with standard JavaScript
- `supabase_function`: Deno runtime with built-in Supabase client

The function slug will be auto-generated from the name if not provided (lowercase with hyphens).

- [Create function secret](https://docs.kapso.ai/api/platform/v1/functions/functions/create-function-secret.md): Create a secret for this function. Secrets are injected as environment variables when your function executes.

Use secrets to store sensitive data without hardcoding in function code:
- API keys (Stripe, OpenAI, Twilio, etc.)
- Database connection strings
- OAuth credentials
- Service account tokens

Requirements:
- Function must be in 'deployed' status (422 if not)
- Secret name must be uppercase alphanumeric with underscores (e.g., STRIPE_API_KEY)
- Secret name must be unique within the function

Secret types are automatically detected:
- String values → text type
- Object/array values → json type

Important: The secret value is only returned in the creation response. It cannot be retrieved later. Store the value securely after creation if needed.

After creating a secret, it's immediately available in your function as an environment variable with the specified name.

- [Delete function](https://docs.kapso.ai/api/platform/v1/functions/functions/delete-function.md): Permanently delete a serverless function. This will also remove the function from the runtime platform and delete all associated secrets.

After deletion:
- Function will be removed from Cloudflare Workers or Supabase Edge Functions
- All function secrets are automatically deleted
- Function endpoint URL will return 404
- Function invocation records are preserved for audit history

This operation cannot be undone. Make sure to backup function code if needed before deletion.

- [Delete function secret](https://docs.kapso.ai/api/platform/v1/functions/functions/delete-function-secret.md): Permanently delete a secret from this function. The secret will be removed from the runtime environment and will no longer be available as an environment variable.

Requirements:
- Function must be in 'deployed' status (422 if not)
- Secret must exist (404 if not found)

After deletion:
- Secret is immediately removed from function runtime environment
- Function can no longer access the secret value
- Any function invocations referencing the deleted secret will fail

This operation cannot be undone. Make sure the secret is no longer needed before deletion. If the function code still references the deleted secret, invocations may fail with undefined variable errors.

- [Deploy function](https://docs.kapso.ai/api/platform/v1/functions/functions/deploy-function.md): Deploy a function to the serverless runtime platform asynchronously. Deployment happens in the background and may take 10-60 seconds.

You'll receive a 202 Accepted response immediately. To check deployment status:
1. Poll GET /functions/{id} to monitor status field
2. Wait for status to change from 'draft' to 'deployed' (success) or 'error' (failure)
3. Check last_deployed_at timestamp to confirm deployment completion

Deployment process:
- For `cloudflare_worker`: Code is deployed to Cloudflare's global edge network
- For `supabase_function`: Code is deployed to Supabase Edge Functions with Deno runtime

Deployment will fail (status='error') if:
- Function code has syntax errors
- Function type is 'supabase_function' but no Supabase project is configured
- Runtime platform API is unavailable

After successful deployment, the function is immediately available for invocation via POST /functions/{id}/invoke.

- [Invoke function](https://docs.kapso.ai/api/platform/v1/functions/functions/invoke-function.md): Execute a deployed serverless function with a custom JSON payload. The request body is forwarded directly to your function code.

Request payload structure is completely flexible - send any valid JSON that your function expects. Your function receives the payload as the request body and can parse it however needed.

Response structure mirrors whatever your function returns. This endpoint acts as a pass-through proxy to your serverless function.

The function must be in 'deployed' status to be invoked. If the function is in 'draft' or 'error' status, the request will fail with 422 validation error.

Execution tracking:
- All invocations are tracked with timing and request/response data
- Failed invocations return an `invocation_id` for debugging
- Check function invocation history via GET /functions/{id} (extended view)

Error handling:
- Function execution errors are captured and returned with details
- Errors are truncated to 512 characters for storage
- Original error context is preserved in invocation record

- [List function secrets](https://docs.kapso.ai/api/platform/v1/functions/functions/list-function-secrets.md): Retrieve all secret names configured for this function. Secret values are NEVER included in list responses for security.

Secrets are injected as environment variables when your function executes. Use this endpoint to:
- Audit which secrets are configured
- Verify secret names before creating new ones
- Check secret types (text, json, inherited)

Important: If the function is not deployed, this endpoint returns an empty array. Secrets can only be managed for deployed functions.

Secret values are only returned once when creating a secret via POST /functions/{id}/secrets. After creation, values cannot be retrieved - only the secret name and type are visible.

- [List functions](https://docs.kapso.ai/api/platform/v1/functions/functions/list-functions.md): Retrieve all serverless functions for your project. Functions are custom JavaScript code that runs on-demand in response to API invocations.

Use this endpoint to:
- List all configured functions
- Review function deployment status
- Audit function creation and updates

- [Retrieve function](https://docs.kapso.ai/api/platform/v1/functions/functions/retrieve-function.md): Get complete details for a serverless function including code, configuration, deployment status, and computed URLs.

Use this endpoint to:
- Review function code before updating
- Check deployment status and version
- Get endpoint URL for external invocation
- Retrieve runtime configuration

- [Update function](https://docs.kapso.ai/api/platform/v1/functions/functions/update-function.md): Update function metadata or code. Supports partial updates - only include fields you want to change.

Common updates:
- Update function code (requires redeployment to take effect)
- Change function name or description
- Update runtime configuration
- Modify function slug

Important: Code updates are saved immediately but do NOT automatically deploy. After updating code, you must call POST /functions/{id}/deploy for changes to take effect in production.

- [Assign WhatsApp phone number](https://docs.kapso.ai/api/platform/v1/functions/voice-agents/assign-whatsapp-phone-number.md): Assign a WhatsApp phone number to route voice calls to this voice agent. When users initiate voice calls from WhatsApp to this number, the call will be handled by this agent.

Each voice agent can have multiple phone number assignments, but only one can be marked as primary. The primary number is used as the default for new calls.

Assignment rules:
- Phone number must exist in your project
- Phone number cannot be assigned to multiple voice agents simultaneously
- Only one assignment per agent can be primary
- Assignments can be enabled/disabled without deletion

After assignment:
- Voice calls to the phone number will route to this agent
- If is_primary=true, this becomes the default number for the agent

- [Create voice agent](https://docs.kapso.ai/api/platform/v1/functions/voice-agents/create-voice-agent.md): Create a new voice agent with provider configuration. Voice agents handle WhatsApp voice calls and route them to third-party voice providers.

After creating a voice agent:
1. Assign WhatsApp phone numbers using POST /voice_agents/{id}/whatsapp/phone_numbers
2. Configure provider settings (API keys, agent name, etc.)
3. Test voice call routing

Currently supported providers:
- Pipecat (VoiceAgents::PipecatProvider): Requires public_api_key, private_api_key, and agent_name

- [Delete voice agent](https://docs.kapso.ai/api/platform/v1/functions/voice-agents/delete-voice-agent.md): Permanently delete a voice agent. This will also remove all WhatsApp phone number assignments for this agent.

After deletion:
- All assigned phone numbers will no longer route voice calls to this agent
- Active voice calls may be dropped
- WhatsApp phone number assignments are automatically removed

This operation cannot be undone. Make sure to reassign phone numbers to other voice agents if needed.

- [Delete WhatsApp phone number assignment](https://docs.kapso.ai/api/platform/v1/functions/voice-agents/delete-whatsapp-phone-number-assignment.md): Permanently remove a phone number assignment from this voice agent using the assignment_id (not phone_number_id).

The assignment_id is the 'id' field returned when creating or listing assignments.
To find the assignment_id for a specific phone number, use GET /voice_agents/{voice_agent_id}/whatsapp/phone_numbers.

After deletion:
- Voice calls to this number will not be handled by this agent
- If this was the primary assignment, you should assign a new primary number
- Active voice calls may be dropped

This operation cannot be undone. If you need to temporarily disable routing, use PATCH to set enabled=false instead.

- [List voice agents](https://docs.kapso.ai/api/platform/v1/functions/voice-agents/list-voice-agents.md): Retrieve all voice agents for your project. Voice agents handle WhatsApp voice calls and route them to configured voice providers.

Use this endpoint to:
- List all configured voice agents
- Filter by provider type
- Audit voice agent creation over time

- [List WhatsApp phone number assignments](https://docs.kapso.ai/api/platform/v1/functions/voice-agents/list-whatsapp-phone-number-assignments.md): Retrieve all WhatsApp phone numbers assigned to this voice agent. Assignments define which phone numbers route voice calls to this agent.

Use this endpoint to:
- Review all phone numbers handling voice calls for this agent
- Check which number is the primary assignment
- Audit assignment status (enabled/disabled)

- [Retrieve voice agent](https://docs.kapso.ai/api/platform/v1/functions/voice-agents/retrieve-voice-agent.md): Get complete details for a voice agent including provider configuration.

Use this endpoint to:
- Review voice agent configuration
- Check provider settings
- Get voice agent name and metadata

- [Update voice agent](https://docs.kapso.ai/api/platform/v1/functions/voice-agents/update-voice-agent.md): Update voice agent configuration. Supports partial updates - only include fields you want to change.

Common updates:
- Change voice agent name
- Update provider configuration (API keys, agent name, base URL)
- Switch provider type

Note: Updating provider configuration may require restarting active voice calls to use the new settings.

- [Update WhatsApp phone number assignment](https://docs.kapso.ai/api/platform/v1/functions/voice-agents/update-whatsapp-phone-number-assignment.md): Update an existing phone number assignment using the assignment_id (not phone_number_id).

The assignment_id is the 'id' field returned when creating or listing assignments.
To find the assignment_id for a specific phone number, use GET /voice_agents/{voice_agent_id}/whatsapp/phone_numbers.

Common updates:
- Make this the primary number (is_primary=true) - will demote the current primary
- Disable assignment temporarily (enabled=false) - stops routing without deleting
- Re-enable disabled assignment (enabled=true)

Note: Setting is_primary=true on this assignment will automatically set is_primary=false on any other primary assignment for this voice agent.

- [List conversation workflow executions](https://docs.kapso.ai/api/platform/v1/functions/whatsapp-conversations/list-conversation-workflow-executions.md): Retrieve workflow executions associated with a WhatsApp conversation. Executions are returned in reverse chronological order (most recent first).

Use this endpoint to map a conversation to its workflow executions and track automation history for a specific conversation.

**Response**: Returns summary data (id, status, tracking_id, timestamps, workflow, current_step). Does not include execution_context or events. Use GET /workflow_executions/{id} to retrieve full execution details.

**Pagination**: Available in both HTTP headers (X-Total, X-Total-Pages, X-Per-Page, X-Page, Link) and response body (`meta` object with page, per_page, total_pages, total_count).

- [Create workflow trigger](https://docs.kapso.ai/api/platform/v1/functions/workflow-triggers/create-workflow-trigger.md): Create a new trigger for a workflow. Triggers define when the workflow should automatically execute.

Trigger types:
- `inbound_message`: Workflow starts when WhatsApp messages arrive at specified phone number (requires phone_number_id)
- `api_call`: Workflow starts only via POST /workflows/{id}/executions (no phone_number_id needed)

After creating a trigger:
- For inbound_message: Messages to the phone_number_id will start workflow executions
- For api_call: Workflow can only be started via API endpoint

Note: A workflow can have multiple triggers (e.g., multiple phone numbers, or both inbound_message and api_call).

- [Delete workflow trigger](https://docs.kapso.ai/api/platform/v1/functions/workflow-triggers/delete-workflow-trigger.md): Permanently delete a workflow trigger. This will stop the workflow from executing automatically based on this trigger.

After deletion:
- For inbound_message triggers: Messages to the phone_number_id will no longer start this workflow
- For api_call triggers: The workflow can still be started manually via POST /workflows/{id}/executions

This operation cannot be undone. If you need to temporarily disable a trigger, use PATCH to set active=false instead.

- [List workflow triggers](https://docs.kapso.ai/api/platform/v1/functions/workflow-triggers/list-workflow-triggers.md): Retrieve all triggers configured for a workflow. Triggers define when and how a workflow should automatically execute.

Use this endpoint to:
- Review configured triggers for a workflow
- Audit which phone numbers trigger this workflow
- Check trigger active status

- [Update workflow trigger](https://docs.kapso.ai/api/platform/v1/functions/workflow-triggers/update-workflow-trigger.md): Update a workflow trigger. Currently only the 'active' status can be modified.

Use this to:
- Temporarily disable a trigger without deleting it (set active=false)
- Re-enable a previously disabled trigger (set active=true)

Note: To change trigger type or phone_number_id, delete the trigger and create a new one.

- [Create workflow](https://docs.kapso.ai/api/platform/v1/functions/workflows/create-workflow.md): Create a new workflow in draft status. You can provide a minimal definition (just a start node) and build out the workflow later, or provide a complete workflow definition with all nodes and edges.

After creating a workflow, you can:
1. Update the definition to add more nodes/edges
2. Create triggers to specify when the workflow should execute
3. Activate the workflow by changing status to 'active'

- [List workflow executions](https://docs.kapso.ai/api/platform/v1/functions/workflows/list-workflow-executions.md): Retrieve execution history for a workflow. Executions are returned in reverse chronological order (most recent first). Use query parameters to filter by status, time range, or pagination.

**Response**: Returns summary data (id, status, tracking_id, timestamps, workflow, current_step). Does not include execution_context or events. Use GET /workflow_executions/{id} to retrieve full execution details.

**Pagination**: Available in both HTTP headers (X-Total, X-Total-Pages, X-Per-Page, X-Page, Link) and response body (`meta` object with page, per_page, total_pages, total_count).

Common use cases:
- Monitor active executions for a workflow
- Review failed executions for debugging
- Audit execution history over time
- Find waiting executions that need user input

- [List workflows](https://docs.kapso.ai/api/platform/v1/functions/workflows/list-workflows.md): Retrieve all workflows for your project. Workflows are returned ordered by creation time (newest first). Use query parameters to filter by status, name, or creation date.

Common use cases:
- List all active workflows ready for execution
- Find workflows by partial name match
- Audit workflow creation over time

- [Resume waiting workflow execution](https://docs.kapso.ai/api/platform/v1/functions/workflows/resume-waiting-workflow-execution.md): Resume a workflow execution that is in 'waiting' status. Workflows enter waiting status when they reach a wait_for_response step or are explicitly paused.

Send a message with:
- `kind`: Message type, defaults to "payload" if omitted
- `data`: The actual payload - can be a string for simple text responses (e.g., "yes", "no") or an object for structured data (e.g., button clicks, form submissions)

Optionally include variables to update the execution context:
- `variables`: Key-value pairs to merge into the execution context. These will be available in subsequent workflow steps as `{{var_name}}`. Existing variables with the same key will be overwritten.

After resuming, the workflow will continue processing from the waiting step with the provided message data and updated variables.

**Response**: Returns minimal execution data (id, status, tracking_id, timestamps, workflow, current_step). Does not include execution_context or events. Use GET /workflow_executions/{id} to retrieve full execution details.

- [Retrieve workflow](https://docs.kapso.ai/api/platform/v1/functions/workflows/retrieve-workflow.md): Get complete details for a specific workflow including its definition, status, execution stats, and metadata.

Use this endpoint to:
- Retrieve workflow configuration before updating
- Check workflow status and execution count
- Get the current workflow definition for cloning or backup

- [Retrieve workflow execution](https://docs.kapso.ai/api/platform/v1/functions/workflows/retrieve-workflow-execution.md): Get complete details for a workflow execution including current status, execution context, variables, and full event history.

**This is the only endpoint that returns the full execution_context** (vars, system, context, metadata) along with the complete event history.

Use this endpoint to:
- Monitor execution progress and current step
- Debug failed executions with full event log
- Review execution variables and context
- Check error details when status is 'failed'

The response includes:
- Current status and step
- Complete event chronology (step transitions, agent actions, variable updates)
- Full execution_context with standard structure (vars, system, context, metadata)
- Error details if execution failed

- [Start workflow execution](https://docs.kapso.ai/api/platform/v1/functions/workflows/start-workflow-execution.md): Start a new execution of a workflow asynchronously. The workflow will begin processing in the background.

You'll receive a 202 Accepted response with a tracking_id immediately. Use this tracking_id to:
- Poll GET /workflow_executions with tracking_id filter to check status
- Correlate execution events with your own systems

The execution will fail if:
- The workflow is not in 'active' status
- Required phone_number is missing or invalid
- The workflow definition is malformed

Use cases:
- Start workflow from external trigger (API, webhook, scheduled job)
- Test workflow with specific initial variables
- Retry failed execution with same parameters

- [Update workflow](https://docs.kapso.ai/api/platform/v1/functions/workflows/update-workflow.md): Update workflow metadata or definition. Supports partial updates - only include fields you want to change.

Common updates:
- Change workflow name or description
- Update workflow definition (add/modify/remove nodes and edges)
- Activate workflow by setting status to 'active'
- Archive workflow by setting status to 'archived'

Note: You can update the definition of an active workflow. Changes take effect immediately for new executions (running executions continue with the old definition).

- [Update workflow execution status](https://docs.kapso.ai/api/platform/v1/functions/workflows/update-workflow-execution-status.md): Manually update the status of a workflow execution. This is useful for programmatically controlling workflow lifecycle from external systems.

**Allowed status transitions:**
- `ended` - End the execution immediately
- `handoff` - Transfer execution to human agent
- `waiting` - Pause execution until resumed

**Use cases:**
- End workflows based on external events
- Transfer complex queries to human agents
- Implement custom timeout logic
- Coordinate workflows with external systems

Invalid transitions (e.g., transitioning from a terminal state) will return a 422 error with details about why the transition is not allowed.

**Response**: Returns full execution data including the updated status. Use GET /workflow_executions/{id} to retrieve execution context and event history.

- [Upload media](https://docs.kapso.ai/api/platform/v1/media/upload-media.md): Upload media files for WhatsApp messaging from public URLs.

Supports two delivery methods:
- `meta_media`: Standard upload to Meta's media endpoint (30-day lifetime)
- `meta_resumable_asset`: Resumable upload flow for profile pictures and large files

**Security**: SSRF-protected - blocks private IPs, localhost, and metadata endpoints

**Size limits**:
- Images: 5 MB
- Audio/Video: 16 MB
- Documents: 100 MB

Requests exceeding these limits fail immediately.

- [Check phone health](https://docs.kapso.ai/api/platform/v1/phone-numbers/check-phone-health.md): Live health check via Meta APIs and Kapso services.
- [Connect phone number](https://docs.kapso.ai/api/platform/v1/phone-numbers/connect-phone-number.md): Connect a WhatsApp number to this customer using Meta credentials.

Get credentials from Meta's App Dashboard after completing embedded signup or manual setup.

- [Delete phone number](https://docs.kapso.ai/api/platform/v1/phone-numbers/delete-phone-number.md)
- [Get phone number](https://docs.kapso.ai/api/platform/v1/phone-numbers/get-phone-number.md)
- [List phone numbers](https://docs.kapso.ai/api/platform/v1/phone-numbers/list-phone-numbers.md): Get WhatsApp numbers in your project, most recent first.
- [Update phone number](https://docs.kapso.ai/api/platform/v1/phone-numbers/update-phone-number.md)
- [Create setup link](https://docs.kapso.ai/api/platform/v1/setup-links/create-setup-link.md): Generate a hosted onboarding page for customers to connect their WhatsApp number.

The link guides them through Meta's embedded signup and optionally provisions a new number.

- [List setup links](https://docs.kapso.ai/api/platform/v1/setup-links/list-setup-links.md): Get WhatsApp onboarding links for a customer, most recent first.
- [Update setup link](https://docs.kapso.ai/api/platform/v1/setup-links/update-setup-link.md)
- [Create webhook](https://docs.kapso.ai/api/platform/v1/webhooks/create-webhook.md): Subscribe to WhatsApp events for this number.

Use buffering to batch high-volume events like inbound messages. Without buffering, each message triggers an immediate webhook delivery.

- [Delete webhook](https://docs.kapso.ai/api/platform/v1/webhooks/delete-webhook.md)
- [Get webhook](https://docs.kapso.ai/api/platform/v1/webhooks/get-webhook.md)
- [List webhooks](https://docs.kapso.ai/api/platform/v1/webhooks/list-webhooks.md): Get webhooks for this number, most recent first.
- [Update webhook](https://docs.kapso.ai/api/platform/v1/webhooks/update-webhook.md)
- [Changelog](https://docs.kapso.ai/changelog.md): Product updates and announcements
- [API setup](https://docs.kapso.ai/docs/build-voice-agents/api.md): Programmatically enable voice calling for your customers' WhatsApp accounts.
- [Architecture](https://docs.kapso.ai/docs/build-voice-agents/architecture.md): Understand how Kapso orchestrates WhatsApp voice calls with Pipecat Cloud.
- [Quickstart](https://docs.kapso.ai/docs/build-voice-agents/quickstart.md): Connect a Pipecat Cloud agent to Kapso and answer WhatsApp voice calls in minutes.
- [AI fields](https://docs.kapso.ai/docs/flows/ai-fields.md): Dynamic content generation using AI at runtime
- [Edges](https://docs.kapso.ai/docs/flows/edges.md): Connect workflow nodes to define execution paths
- [Events](https://docs.kapso.ai/docs/flows/events.md): Workflow execution tracking and debugging
- [Agent node](https://docs.kapso.ai/docs/flows/step-types/agent-node.md): AI agent that can use tools and hold conversations
- [Call workflow node](https://docs.kapso.ai/docs/flows/step-types/call-workflow-node.md): Execute another workflow and return to continue execution
- [Decide node](https://docs.kapso.ai/docs/flows/step-types/decide-node.md): Route workflows with AI or custom logic
- [Function node](https://docs.kapso.ai/docs/flows/step-types/function-node.md): Execute custom JavaScript functions in your workflow
- [Handoff node](https://docs.kapso.ai/docs/flows/step-types/handoff-node.md): Transfer workflow execution to human agents
- [Send interactive](https://docs.kapso.ai/docs/flows/step-types/send-interactive-node.md): Send interactive WhatsApp messages
- [Send template](https://docs.kapso.ai/docs/flows/step-types/send-template-node.md): Send WhatsApp template messages
- [Send text](https://docs.kapso.ai/docs/flows/step-types/send-text-node.md): Send WhatsApp text messages
- [Start](https://docs.kapso.ai/docs/flows/step-types/start-node.md): Entry point for every workflow
- [Wait for response](https://docs.kapso.ai/docs/flows/step-types/wait-for-response-node.md): Wait for user input before continuing
- [Triggers](https://docs.kapso.ai/docs/flows/triggers.md): Start workflow execution from WhatsApp messages or API calls
- [Variables and context](https://docs.kapso.ai/docs/flows/variables-and-context.md): Data management throughout workflow execution
- [Webhooks](https://docs.kapso.ai/docs/flows/webhooks.md): Get notified when workflow executions require attention
- [Functions cheatsheet](https://docs.kapso.ai/docs/functions/overview.md): Deploy serverless JavaScript functions with Kapso
- [Connect WhatsApp](https://docs.kapso.ai/docs/how-to/whatsapp/connect-whatsapp.md): Connect your WhatsApp Business account to Kapso
- [Use Kapso Sandbox](https://docs.kapso.ai/docs/how-to/whatsapp/use-sandbox-for-testing.md): Test your WhatsApp agents safely without production credentials
- [Introduction](https://docs.kapso.ai/docs/introduction.md): Send your first message.
- [MCP server](https://docs.kapso.ai/docs/mcp/introduction.md): WhatsApp operations and platform API via MCP
- [Broadcasts API](https://docs.kapso.ai/docs/platform/broadcasts-api.md): Send template messages to multiple recipients programmatically
- [Connection detection](https://docs.kapso.ai/docs/platform/detecting-whatsapp-connection.md): Know when customers complete WhatsApp onboarding
- [Getting started](https://docs.kapso.ai/docs/platform/getting-started.md): Enable WhatsApp for your customers
- [WhatsApp Inbox](https://docs.kapso.ai/docs/platform/inbox.md): Documentation for inbox behaviour and features
- [Setup links](https://docs.kapso.ai/docs/platform/setup-links.md): Customize the WhatsApp onboarding experience
- [Advanced features](https://docs.kapso.ai/docs/platform/webhooks/advanced.md): Message buffering, ordering, and retry policy
- [Event types](https://docs.kapso.ai/docs/platform/webhooks/event-types.md): Available webhook events and their payloads
- [Legacy v1 webhooks](https://docs.kapso.ai/docs/platform/webhooks/legacy.md): Migration guide for v1 webhook payloads
- [Webhooks overview](https://docs.kapso.ai/docs/platform/webhooks/overview.md): Get real-time notifications for WhatsApp events
- [Webhook security](https://docs.kapso.ai/docs/platform/webhooks/security.md): Verify webhook signatures to prevent unauthorized requests
- [Display names](https://docs.kapso.ai/docs/whatsapp/display-names.md): Change your WhatsApp Business display name
- [Data endpoint](https://docs.kapso.ai/docs/whatsapp/flows/data-endpoint.md): Serve dynamic data to WhatsApp Flows
- [Examples](https://docs.kapso.ai/docs/whatsapp/flows/examples.md): WhatsApp Flow examples and templates
- [Flow JSON](https://docs.kapso.ai/docs/whatsapp/flows/flow-json.md): Structure of WhatsApp Flow JSON
- [Flows in Kapso](https://docs.kapso.ai/docs/whatsapp/flows/kapso-integration.md): What Kapso handles and what you configure
- [Overview](https://docs.kapso.ai/docs/whatsapp/flows/overview.md): What are WhatsApp Flows and how to use them with Kapso
- [Sending & receiving](https://docs.kapso.ai/docs/whatsapp/flows/sending-flows.md): Send WhatsApp Flows and receive responses via webhooks
- [Static vs dynamic](https://docs.kapso.ai/docs/whatsapp/flows/static-vs-dynamic.md): Choose between static and dynamic WhatsApp Flows
- [Pricing](https://docs.kapso.ai/docs/whatsapp/pricing-faq.md): Understanding Kapso and Meta billing
- [Receive messages](https://docs.kapso.ai/docs/whatsapp/receive-messages.md): Get notified when WhatsApp events happen
- [Send audio](https://docs.kapso.ai/docs/whatsapp/send-messages/audio.md): Send audio and voice messages via SDK or API
- [Send buttons](https://docs.kapso.ai/docs/whatsapp/send-messages/buttons.md): Send interactive button messages via SDK or API
- [Send contact](https://docs.kapso.ai/docs/whatsapp/send-messages/contact.md): Send contact card messages via SDK or API
- [Send document](https://docs.kapso.ai/docs/whatsapp/send-messages/document.md): Send document messages via SDK or API
- [Send image](https://docs.kapso.ai/docs/whatsapp/send-messages/image.md): Send image messages via SDK or API
- [Send lists](https://docs.kapso.ai/docs/whatsapp/send-messages/lists.md): Send interactive list messages via SDK or API
- [Send location](https://docs.kapso.ai/docs/whatsapp/send-messages/location.md): Send location messages via SDK or API
- [Mark messages as read](https://docs.kapso.ai/docs/whatsapp/send-messages/mark-read.md): Mark messages as read with optional typing indicator
- [Send reaction](https://docs.kapso.ai/docs/whatsapp/send-messages/reaction.md): React to messages with emoji via SDK or API
- [Send sticker](https://docs.kapso.ai/docs/whatsapp/send-messages/sticker.md): Send stickers via SDK or API
- [Send text](https://docs.kapso.ai/docs/whatsapp/send-messages/text.md): Send text messages via SDK or API
- [Send video](https://docs.kapso.ai/docs/whatsapp/send-messages/video.md): Send video messages via SDK or API
- [Advanced](https://docs.kapso.ai/docs/whatsapp/templates/advanced.md): Create and send templates with catalog, MPM, and Flow buttons
- [Authentication](https://docs.kapso.ai/docs/whatsapp/templates/authentication.md): Create and send OTP authentication templates
- [Buttons](https://docs.kapso.ai/docs/whatsapp/templates/buttons.md): Create and send templates with URL and quick reply buttons
- [Template lifecycle](https://docs.kapso.ai/docs/whatsapp/templates/lifecycle.md): Understanding template statuses, Meta review, and syncing
- [Location header](https://docs.kapso.ai/docs/whatsapp/templates/location-header.md): Create and send templates with location headers
- [Media header](https://docs.kapso.ai/docs/whatsapp/templates/media-header.md): Create and send templates with image, video, or document headers
- [Simple text](https://docs.kapso.ai/docs/whatsapp/templates/simple-text.md): Create and send templates with body text parameters
- [Text header](https://docs.kapso.ai/docs/whatsapp/templates/text-header.md): Create and send templates with text header, body, and footer
- [Troubleshooting](https://docs.kapso.ai/docs/whatsapp/troubleshooting.md): Common WhatsApp errors and how to resolve them
- [Calls](https://docs.kapso.ai/docs/whatsapp/typescript-sdk/calls.md): Initiate and manage WhatsApp voice calls with the TypeScript SDK
- [Contacts](https://docs.kapso.ai/docs/whatsapp/typescript-sdk/contacts.md): List, get, and update WhatsApp contacts with the TypeScript SDK
- [Conversations](https://docs.kapso.ai/docs/whatsapp/typescript-sdk/conversations.md): List, get, and update WhatsApp conversations with the TypeScript SDK
- [Flows](https://docs.kapso.ai/docs/whatsapp/typescript-sdk/flows.md): Author, deploy, preview, and send WhatsApp Flows with the TypeScript SDK
- [Interactive messages](https://docs.kapso.ai/docs/whatsapp/typescript-sdk/interactive.md): Send buttons, lists, products, flows, and more interactive types
- [Quickstart](https://docs.kapso.ai/docs/whatsapp/typescript-sdk/introduction.md): Use the open-source library to call the WhatsApp Cloud API
- [Kapso extensions](https://docs.kapso.ai/docs/whatsapp/typescript-sdk/kapso-extensions.md): Get extra fields with both REST API and TypeScript SDK
- [Media upload](https://docs.kapso.ai/docs/whatsapp/typescript-sdk/media.md): Upload and manage media files
- [Messages](https://docs.kapso.ai/docs/whatsapp/typescript-sdk/messages.md): Send text, media, location, contacts and reactions with the TypeScript SDK
- [Phone numbers](https://docs.kapso.ai/docs/whatsapp/typescript-sdk/phone-numbers.md): Manage WhatsApp phone number settings and business profile
- [Templates](https://docs.kapso.ai/docs/whatsapp/typescript-sdk/templates.md): Build and send approved WhatsApp templates
- [Utilities](https://docs.kapso.ai/docs/whatsapp/typescript-sdk/utilities.md): Conversations, contacts, calls, and phone settings
- [Examples](https://docs.kapso.ai/docs/workflows/examples.md): Workflow examples and use cases
- [Introduction](https://docs.kapso.ai/docs/workflows/introduction.md): Build WhatsApp automations.


## Optional

- [Github](https://github.com/gokapso)
- [Legacy API](https://kapso-1adbad2d.mintlify.app/)