# Getting Started with Agent

To install the agent component, you'll need an existing Convex project. New to Convex? Go through the [tutorial](https://docs.convex.dev/tutorial/).

Run `npm create convex` or follow any of the [quickstarts](https://docs.convex.dev/home) to set one up.

## Installation[​](#installation "Direct link to Installation")

Install the component package:

```
npm install @convex-dev/agent
```

Create a `convex.config.ts` file in your app's `convex/` folder and install the component by calling `use`:

```
// convex/convex.config.ts
import { defineApp } from "convex/server";
import agent from "@convex-dev/agent/convex.config";

const app = defineApp();
app.use(agent);

export default app;
```

Then run `npx convex dev` to generate code for the component. This needs to successfully run once before you start defining Agents.

## Defining your first Agent[​](#defining-your-first-agent "Direct link to Defining your first Agent")

```
import { components } from "./_generated/api";
import { Agent } from "@convex-dev/agent";
import { openai } from "@ai-sdk/openai";

const agent = new Agent(components.agent, {
  name: "My Agent",
  languageModel: openai.chat("gpt-4o-mini"),
  instructions: "You are a weather forecaster.",
  tools: { getWeather, getGeocoding },
  maxSteps: 3,
});
```

## Basic usage[​](#basic-usage "Direct link to Basic usage")

```
import { action } from "./_generated/server";
import { v } from "convex/values";

export const helloWorld = action({
  args: { city: v.string() },
  handler: async (ctx, { city }) => {
    const threadId = await createThread(ctx, components.agent);
    const prompt = `What is the weather in ${city}?`;
    const result = await agent.generateText(ctx, { threadId }, { prompt });
    return result.text;
  },
});
```

If you get type errors about `components.agent`, ensure you've run `npx convex dev` to generate code for the component.

That's it! Check out [Agent Usage](/agents/agent-usage.md) to see more details and options.

# Agent Definition and Usage

Agents encapsulate models, prompting, tools, and other configuration. They can be defined as globals, or at runtime.

They use threads to contain a series of messages used along the way, whether those messages are from a user, another Agent / LLM, or elsewhere. A thread can have multiple Agents responding, or be used by a single Agent.

Agentic workflows are built up by combining contextual prompting (threads, messages, tool responses, RAG, etc.) and dynamic routing via LLM tool calls, structured LLM outputs, or a myriad of other techniques via custom code.

## Basic Agent definition[​](#basic-agent-definition "Direct link to Basic Agent definition")

```
import { components } from "./_generated/api";
import { Agent } from "@convex-dev/agent";
import { openai } from "@ai-sdk/openai";

const agent = new Agent(components.agent, {
  name: "Basic Agent",
  languageModel: openai.chat("gpt-4o-mini"),
});
```

See [below](#customizing-the-agent) for more configuration options.

Everything except the name can be overridden at the call site when calling the LLM, and many features available on the agent can be used without an Agent, if this way of organizing the work is not needed for your use case.

## Dynamic Agent definition[​](#dynamic-agent-definition "Direct link to Dynamic Agent definition")

You can define an Agent at runtime, which is useful if you want to create an Agent for a specific context. This allows the LLM to call tools without requiring the LLM to always pass through full context to each tool call. It also allows dynamically choosing a model or other options for the Agent.

```
import { Agent } from "@convex-dev/agent";
import { type LanguageModel } from "ai";
import type { ActionCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { components } from "./_generated/api";

function createAuthorAgent(
  ctx: ActionCtx,
  bookId: Id<"books">,
  model: LanguageModel,
) {
  return new Agent(components.agent, {
    name: "Author",
    languageModel: model,
    tools: {
      // See https://docs.convex.dev/agents/tools
      getChapter: getChapterTool(ctx, bookId),
      researchCharacter: researchCharacterTool(ctx, bookId),
      writeChapter: writeChapterTool(ctx, bookId),
    },
    maxSteps: 10, // Alternative to stopWhen: stepCountIs(10)
  });
}
```

## Generating text with an Agent[​](#generating-text-with-an-agent "Direct link to Generating text with an Agent")

To generate a message, you provide a prompt (as a string or a list of messages) to be used as context to generate one or more messages via an LLM, using calls like `agent.streamText` or `agent.generateObject`.

The arguments to `generateText` and others are the same as the AI SDK, except you don't have to provide a model. By default it will use the agent's language model. There are also extra arguments that are specific to the Agent component, such as the `promptMessageId` which we'll see below.

[**See the full list of AI SDK arguments here**](https://ai-sdk.dev/docs/reference/ai-sdk-core/generate-text)

The message history will be provided by default as context from the given [thread](/agents/threads.md). See [LLM Context](/agents/context.md) for details on how to configuring the context provided.

Note: `authorizeThreadAccess` referenced below is a function you would write to authenticate and authorize the user to access the thread. You can see an example implementation in [threads.ts](https://github.com/get-convex/agent/blob/main/example/convex/threads.ts).

See [chat/basic.ts](https://github.com/get-convex/agent/blob/main/example/convex/chat/basic.ts) or [chat/streaming.ts](https://github.com/get-convex/agent/blob/main/example/convex/chat/streaming.ts) for live code examples.

### Streaming text[​](#streaming-text "Direct link to Streaming text")

Streaming text follows the same pattern as the approach below, but with a few differences, depending on the type of streaming you're doing. See [streaming](/agents/streaming.md) for more details.

### Basic approach (synchronous)[​](#basic-approach-synchronous "Direct link to Basic approach (synchronous)")

```
export const generateReplyToPrompt = action({
  args: { prompt: v.string(), threadId: v.string() },
  handler: async (ctx, { prompt, threadId }) => {
    // await authorizeThreadAccess(ctx, threadId);
    const result = await agent.generateText(ctx, { threadId }, { prompt });
    return result.text;
  },
});
```

Note: best practice is to not rely on returning data from the action. Instead, query for the thread messages via the `useThreadMessages` hook and receive the new message automatically. See below.

### Saving the prompt then generating response(s) asynchronously[​](#saving-the-prompt-then-generating-responses-asynchronously "Direct link to Saving the prompt then generating response(s) asynchronously")

While the above approach is simple, generating responses asynchronously provide a few benefits:

* You can set up optimistic UI updates on mutations that are transactional, so the message will be shown optimistically on the client until the message is saved and present in your message query.
* You can save the message in the same mutation (transaction) as other writes to the database. This message can the be used and re-used in an action with retries, without duplicating the prompt message in the history. If the `promptMessageId` is used for multiple generations, any previous responses will automatically be included as context, so the LLM can continue where it left off. See [workflows](/agents/workflows.md) for more details.
* Thanks to the idempotent guarantees of mutations, the client can safely retry mutations for days until they run exactly once. Actions can transiently fail.

Any clients listing the messages will automatically get the new messages as they are created asynchronously.

To generate responses asynchronously, you need to first save the message, then pass the `messageId` as `promptMessageId` to generate / stream text.

```
import { components, internal } from "./_generated/api";
import { saveMessage } from "@convex-dev/agent";
import { internalAction, mutation } from "./_generated/server";
import { v } from "convex/values";

// Step 1: Save a user message, and kick off an async response.
export const sendMessage = mutation({
  args: { threadId: v.id("threads"), prompt: v.string() },
  handler: async (ctx, { threadId, prompt }) => {
    const { messageId } = await saveMessage(ctx, components.agent, {
      threadId,
      prompt,
    });
    await ctx.scheduler.runAfter(0, internal.example.generateResponseAsync, {
      threadId,
      promptMessageId: messageId,
    });
  },
});

// Step 2: Generate a response to a user message.
export const generateResponseAsync = internalAction({
  args: { threadId: v.string(), promptMessageId: v.string() },
  handler: async (ctx, { threadId, promptMessageId }) => {
    await agent.generateText(ctx, { threadId }, { promptMessageId });
  },
});
```

Note that the action doesn't need to return anything. All messages are saved by default, so any client subscribed to the thread messages will receive the new message as it is generated asynchronously.

The Step 2 code is common enough that there's a utility to save you some typing. It takes in some parameters to control streaming, etc. For more details, see [the code](https://github.com/get-convex/agent/blob/main/src/client/index.ts#L1475-L1557).

```
// Equivalent to Step 2 above.
export const generateResponseAsync = agent.asTextAction();
```

### Generating an object[​](#generating-an-object "Direct link to Generating an object")

Similar to the AI SDK, you can generate or stream an object. The same arguments apply, except you don't have to provide a model. It will use the agent's default language model.

```
import { z } from "zod/v3";

const result = await thread.generateObject({
  prompt: "Generate a plan based on the conversation so far",
  schema: z.object({...}),
});
```

Unfortunately, object generation doesn't support using tools. One, however, is to structure your object as arguments to a tool call that returns the object. You can use a custom `stopWhen` to stop the generation when the tool call produces the result and use `toolChoice: "required"` to prevent the LLM from returning a text response.

## Customizing the agent[​](#customizing-the-agent "Direct link to Customizing the agent")

The agent by default only needs a `chat` model to be configured. However, for vector search, you'll need a `textEmbeddingModel` model. A `name` is helpful to attribute each message to a specific agent. Other options are defaults that can be over-ridden at each LLM call-site.

```
import { tool, stepCountIs } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod/v3";
import { Agent, createTool, type Config } from "@convex-dev/agent";
import { components } from "./_generated/api";

const sharedDefaults = {
  // The language model to use for the agent.
  languageModel: openai.chat("gpt-4o-mini"),
  // Embedding model to power vector search of message history (RAG).
  textEmbeddingModel: openai.embedding("text-embedding-3-small"),
  // Used for fetching context messages. See https://docs.convex.dev/agents/context
  contextOptions,
  // Used for storing messages. See https://docs.convex.dev/agents/messages
  storageOptions,
  // Used for tracking token usage. See https://docs.convex.dev/agents/usage-tracking
  usageHandler: async (ctx, args) => {
    const { usage, model, provider, agentName, threadId, userId } = args;
    // ... log, save usage to your database, etc.
  },
  // Used for filtering, modifying, or enriching the context messages. See https://docs.convex.dev/agents/context
  contextHandler: async (ctx, args) => {
    return [...customMessages, args.allMessages];
  },
  // Useful if you want to log or record every request and response.
  rawResponseHandler: async (ctx, args) => {
    const { request, response, agentName, threadId, userId } = args;
    // ... log, save request/response to your database, etc.
  },
  // Used for limiting the number of retries when a tool call fails. Default: 3.
  callSettings: { maxRetries: 3, temperature: 1.0 },
} satisfies Config;


const supportAgent = new Agent(components.agent, {
  // The default system prompt if not over-ridden.
  instructions: "You are a helpful assistant.",
  tools: {
    // Convex tool. See https://docs.convex.dev/agents/tools
    myConvexTool: createTool({
      description: "My Convex tool",
      args: z.object({...}),
      // Note: annotate the return type of the handler to avoid type cycles.
      handler: async (ctx, args): Promise<string> => {
        return "Hello, world!";
      },
    }),
    // Standard AI SDK tool
    myTool: tool({ description, parameters, execute: () => {}}),
  },
  // Used for limiting the number of steps when tool calls are involved.
  // NOTE: if you want tool calls to happen automatically with a single call,
  // you need to set this to something greater than 1 (the default).
  stopWhen: stepCountIs(5),
  ...sharedDefaults,
});
```
# Threads

Threads are a way to group messages together in a linear history. All messages saved in the Agent component are associated with a thread. When a message is generated based on a prompt, it saves the user message and generated agent message(s) automatically.

Threads can be associated with a user, and messages can each individually be associated with a user. By default, messages are associated with the thread's user.

## Creating a thread[​](#creating-a-thread "Direct link to Creating a thread")

You can create a thread in a mutation or action. If you create it in an action, it will also return a `thread` (see below) and you can start calling LLMs and generating messages. If you specify a userId, the thread will be associated with that user and messages will be saved to the user's history.

```
import { createThread } from "@convex-dev/agent";

const threadId = await createThread(ctx, components.agent);
```

You may also pass in metadata to set on the thread:

```
const userId = await getAuthUserId(ctx);
const threadId = await createThread(ctx, components.agent, {
  userId,
  title: "My thread",
  summary: "This is a summary of the thread",
});
```

Metadata may be provided as context to the agent automatically in the future, but for now it's a convenience that helps organize threads in the [Playground](/agents/playground.md).

## Generating a message in a thread[​](#generating-a-message-in-a-thread "Direct link to Generating a message in a thread")

You can generate a message in a thread via the agent functions: `agent.generateText`, `agent.generateObject`, `agent.streamText`, and `agent.streamObject`. Any agent can generate a message in a thread created by any other agent.

```
const agent = new Agent(components.agent, { languageModel, instructions });

export const generateReplyToPrompt = action({
  args: { prompt: v.string(), threadId: v.string() },
  handler: async (ctx, { prompt, threadId }) => {
    // await authorizeThreadAccess(ctx, threadId);
    const result = await agent.generateText(ctx, { threadId }, { prompt });
    return result.text;
  },
});
```

See [Messages](/agents/messages.md) for more details on creating and saving messages.

## Continuing a thread using the `thread` object from `agent.continueThread`[​](#continuing-a-thread-using-the-thread-object-from-agentcontinuethread "Direct link to continuing-a-thread-using-the-thread-object-from-agentcontinuethread")

You can also continue a thread by creating an agent-specific `thread` object, either when calling `agent.createThread` or `agent.continueThread` from within an action. This allows calling methods without specifying those parameters each time.

```
const { thread } = await agent.continueThread(ctx, { threadId });
const result = await thread.generateText({ prompt });
```

The `thread` from `continueThread` or `createThread` (available in actions only) is a `Thread` object, which has convenience methods that are thread-specific:

* `thread.getMetadata()` to get the `userId`, `title`, `summary` etc.
* `thread.updateMetadata({ patch: { title, summary, userId} })` to update the metadata
* `thread.generateText({ prompt, ... })` - equivalent to `agent.generateText(ctx, { threadId }, { prompt, ... })`
* `thread.streamText({ prompt, ... })` - equivalent to `agent.streamText(ctx, { threadId }, { prompt, ... })`
* `thread.generateObject({ prompt, ... })` - equivalent to `agent.generateObject(ctx, { threadId }, { prompt, ... })`
* `thread.streamObject({ prompt, ... })` - equivalent to `agent.streamObject(ctx, { threadId }, { prompt, ... })`

See [Messages docs](/agents/messages.md) for more details on generating messages.

## Deleting threads[​](#deleting-threads "Direct link to Deleting threads")

You can delete threads by their `threadId`.

Asynchronously (from a mutation or action):

```
await agent.deleteThreadAsync(ctx, { threadId });
```

Synchronously in batches (from an action):

```
await agent.deleteThreadSync(ctx, { threadId });
```

You can also delete all threads by a user by their `userId`.

```
await agent.deleteThreadsByUserId(ctx, { userId });
```

## Getting all threads owned by a user[​](#getting-all-threads-owned-by-a-user "Direct link to Getting all threads owned by a user")

```
const threads = await ctx.runQuery(
  components.agent.threads.listThreadsByUserId,
  { userId, paginationOpts: args.paginationOpts },
);
```

## Deleting all threads and messages associated with a user[​](#deleting-all-threads-and-messages-associated-with-a-user "Direct link to Deleting all threads and messages associated with a user")

Asynchronously (from a mutation or action):

```
await ctx.runMutation(components.agent.users.deleteAllForUserIdAsync, {
  userId,
});
```

Synchronously (from an action):

```
await ctx.runMutation(components.agent.users.deleteAllForUserId, { userId });
```

## Getting messages in a thread[​](#getting-messages-in-a-thread "Direct link to Getting messages in a thread")

See [messages.mdx](/agents/messages.md) for more details.

```
import { listMessages } from "@convex-dev/agent";

const messages = await listMessages(ctx, components.agent, {
  threadId,
  excludeToolMessages: true,
  paginationOpts: { cursor: null, numItems: 10 }, // null means start from the beginning
});
```

Or for the UIMessage type (easier for rendering UIs):

```
import { listUIMessages } from "@convex-dev/agent";

const messages = await listUIMessages(ctx, components.agent, {
  threadId,
  paginationOpts: { cursor: null, numItems: 10 },
});
```
# Messages

The Agent component stores message and [thread](/agents/threads.md) history to enable conversations between humans and agents.

To see how humans can act as agents, see [Human Agents](/agents/human-agents.md).

## Retrieving messages[​](#retrieving-messages "Direct link to Retrieving messages")

For clients to show messages, you need to expose a query that returns the messages. For streaming, see [retrieving streamed deltas](/agents/streaming.md#retrieving-streamed-deltas) for a modified version of this query.

See [chat/basic.ts](https://github.com/get-convex/agent/blob/main/example/convex/chat/basic.ts) for the server-side code, and [chat/streaming.ts](https://github.com/get-convex/agent/blob/main/example/convex/chat/streaming.ts) for the streaming example.

```
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { listUIMessages } from "@convex-dev/agent";
import { components } from "./_generated/api";

export const listThreadMessages = query({
  args: { threadId: v.string(), paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    await authorizeThreadAccess(ctx, threadId);

    const paginated = await listUIMessages(ctx, components.agent, args);

    // Here you could filter out / modify the documents
    return paginated;
  },
});
```

Note: Above we used `listUIMessages`, which returns UIMessages, specifically the Agent extension that includes some extra fields like order, status, etc. UIMessages combine multiple MessageDocs into a single UIMessage when there are multiple tool calls followed by an assistant message, making it easy to build UIs that work with the various "parts" on the UIMessage.

If you want to get MessageDocs, you can use `listMessages` instead.

## Showing messages in React[​](#showing-messages-in-react "Direct link to Showing messages in React")

See [ChatStreaming.tsx](https://github.com/get-convex/agent/blob/main/example/ui/chat/ChatStreaming.tsx) for a streaming example, or [ChatBasic.tsx](https://github.com/get-convex/agent/blob/main/example/ui/chat/ChatBasic.tsx) for a non-streaming example.

### `useUIMessages` hook[​](#useuimessages-hook "Direct link to useuimessages-hook")

The crux is to use the `useUIMessages` hook. For streaming, pass in `stream: true` to the hook.

```
import { api } from "../convex/_generated/api";
import { useUIMessages } from "@convex-dev/agent/react";

function MyComponent({ threadId }: { threadId: string }) {
  const { results, status, loadMore } = useUIMessages(
    api.chat.streaming.listMessages,
    { threadId },
    { initialNumItems: 10 /* stream: true */ },
  );
  return (
    <div>
      {results.map((message) => (
        <div key={message.key}>{message.text}</div>
      ))}
    </div>
  );
}
```

Note: If you want to work with MessageDocs instead of UIMessages, you can use the older `useThreadMessages` hook instead. However, working with UIMessages enables richer streaming capabilities, such as status on whether the agent is actively reasoning.

### UIMessage type[​](#uimessage-type "Direct link to UIMessage type")

The Agent component extends the AI SDK's `UIMessage` type to provide convenient metadata for rendering messages.

The core UIMessage type from the AI SDK is:

* `parts` is an array of parts (e.g. "text", "file", "image", "toolCall", "toolResult")
* `content` is a string of the message content.
* `role` is the role of the message (e.g. "user", "assistant", "system").

The helper adds these additional fields:

* `key` is a unique identifier for the message.
* `order` is the order of the message in the thread.
* `stepOrder` is the step order of the message in the thread.
* `status` is the status of the message (or "streaming").
* `agentName` is the name of the agent that generated the message.
* `text` is the text of the message.
* `_creationTime` is the timestamp of the message. For streaming messages, it's currently assigned to the current time on the streaming client.

To reference these, ensure you're importing `UIMessage` from `@convex-dev/agent`.

#### `toUIMessages` helper[​](#touimessages-helper "Direct link to touimessages-helper")

`toUIMessages` is a helper function that transforms MessageDocs into AI SDK "UIMessage"s. This is a convenient data model for displaying messages.

If you are using `useThreadMessages` for instance, you can convert the messages to UIMessages like this:

```
import { toUIMessages, type UIMessage } from "@convex-dev/agent";

...
const { results } = useThreadMessages(...);
const uiMessages = toUIMessages(results);
```

### Optimistic updates for sending messages[​](#optimistic-updates-for-sending-messages "Direct link to Optimistic updates for sending messages")

The `optimisticallySendMessage` function is a helper function for sending a message, so you can optimistically show a message in the message list until the mutation has completed on the server.

Pass in the query that you're using to list messages, and it will insert the ephemeral message at the top of the list.

```
const sendMessage = useMutation(
  api.streaming.streamStoryAsynchronously,
).withOptimisticUpdate(
  optimisticallySendMessage(api.streaming.listThreadMessages),
);
```

If your arguments don't include `{ threadId, prompt }` then you can use it as a helper function in your optimistic update:

```
import { optimisticallySendMessage } from "@convex-dev/agent/react";

const sendMessage = useMutation(
  api.chatStreaming.streamStoryAsynchronously,
).withOptimisticUpdate(
  (store, args) => {
    optimisticallySendMessage(api.chatStreaming.listThreadMessages)(store, {
      threadId:
      prompt: /* change your args into the user prompt. */,
    })
  }
);
```

## Saving messages[​](#saving-messages "Direct link to Saving messages")

By default, the Agent will save messages to the database automatically when you provide them as a prompt, as well as all generated messages.

However, it is useful to save the prompt message ahead of time and use the `promptMessageId` to continue the conversation. See [Agent Usage](/agents/agent-usage.md) for more details.

You can save messages to the database manually using `saveMessage` or `saveMessages`, either on the Agent class or as a direct function call.

* You can pass a `prompt` or a full `message` (`ModelMessage` type)
* The `metadata` argument is optional and allows you to provide more details, such as `sources`, `reasoningDetails`, `usage`, `warnings`, `error`, etc.

```
const { messageId } = await saveMessage(ctx, components.agent, {
  threadId,
  userId,
  message: { role: "user", content: "The user message" },
});
```

Note: when calling `agent.generateText` with the raw prompt, embeddings are generated automatically for vector search (if you have a text embedding model configured). Similarly with `agent.saveMessage` when calling from an action. However, if you're saving messages in a mutation, where calling an LLM is not possible, it will generate them automatically if `generateText` receives a `promptMessageId` that lacks an embedding (and you have a text embedding model configured).

### Without the Agent class:[​](#without-the-agent-class "Direct link to Without the Agent class:")

Note: If you aren't using the Agent class with a text embedding model set, you need to pass an `embedding` if you want to save it at the same time.

```
import { saveMessage } from "@convex-dev/agent";

const { messageId } = await saveMessage(ctx, components.agent, {
  threadId,
  userId,
  message: { role: "assistant", content: result },
  metadata: [{ reasoning, usage, ... }] // See MessageWithMetadata type
  agentName: "my-agent",
  embedding: { vector: [0.1, 0.2, ...], model: "text-embedding-3-small" },
});
```

### Using the Agent class:[​](#using-the-agent-class "Direct link to Using the Agent class:")

```
const { messageId } = await agent.saveMessage(ctx, {
  threadId,
  userId,
  prompt,
  metadata,
});
```

```
const { messages } = await agent.saveMessages(ctx, {
  threadId, userId,
  messages: [{ role, content }],
  metadata: [{ reasoning, usage, ... }] // See MessageWithMetadata type
});
```

If you are saving the message in a mutation and you have a text embedding model set, pass `skipEmbeddings: true`. The embeddings for the message will be generated lazily if the message is used as a prompt. Or you can provide an embedding upfront if it's available, or later explicitly generate them using `agent.generateEmbeddings`.

## Configuring the storage of messages[​](#configuring-the-storage-of-messages "Direct link to Configuring the storage of messages")

Generally the defaults are fine, but if you want to pass in multiple messages and have them all saved (vs. just the last one), or avoid saving any input or output messages, you can pass in a `storageOptions` object, either to the Agent constructor or per-message.

The use-case for passing in multiple messages but not saving them is if you want to include some extra messages for context to the LLM, but only the last message is the user's actual request. e.g. `messages = [...messagesFromRag, messageFromUser]`. The default is to save the prompt and all output messages.

```
const result = await thread.generateText({ messages }, {
  storageOptions: {
    saveMessages: "all" | "none" | "promptAndOutput";
  },
});
```

## Message ordering[​](#message-ordering "Direct link to Message ordering")

Each message has `order` and `stepOrder` fields, which are incrementing integers specific to a thread.

When `saveMessage` or `generateText` is called, the message is added to the thread's next `order` with a `stepOrder` of 0.

As response message(s) are generated in response to that message, they are added at the same `order` with the next `stepOrder`.

To associate a response message with a previous message, you can pass in the `promptMessageId` to `generateText` and others.

Note: if the `promptMessageId` is not the latest message in the thread, the context for the message generation will not include any messages following the `promptMessageId`.

## Deleting messages[​](#deleting-messages "Direct link to Deleting messages")

You can delete messages by their `_id` (returned from `saveMessage` or `generateText`) or `order` / `stepOrder`.

By ID:

```
await agent.deleteMessage(ctx, { messageId });
// batch delete
await agent.deleteMessages(ctx, { messageIds });
```

By order (start is inclusive, end is exclusive):

```
// Delete all messages with the same order as a given message:
await agent.deleteMessageRange(ctx, {
  threadId,
  startOrder: message.order,
  endOrder: message.order + 1,
});
// Delete all messages with order 1 or 2.
await agent.deleteMessageRange(ctx, { threadId, startOrder: 1, endOrder: 3 });
// Delete all messages with order 1 and stepOrder 2-4
await agent.deleteMessageRange(ctx, {
  threadId,
  startOrder: 1,
  startStepOrder: 2,
  endOrder: 2,
  endStepOrder: 5,
});
```

## Other utilities:[​](#other-utilities "Direct link to Other utilities:")

```
import { ... } from "@convex-dev/agent";
```

* `serializeDataOrUrl` is a utility function that serializes an AI SDK `DataContent` or `URL` to a Convex-serializable format.
* `filterOutOrphanedToolMessages` is a utility function that filters out tool call messages that don't have a corresponding tool result message.
* `extractText` is a utility function that extracts text from a `ModelMessage`-like object.

### Validators and types[​](#validators-and-types "Direct link to Validators and types")

There are types to validate and provide types for various values

```
import { ... } from "@convex-dev/agent";
```

* `vMessage` is a validator for a `ModelMessage`-like object (with a `role` and `content` field e.g.).
* `MessageDoc` and `vMessageDoc` are the types for a message (which includes a `.message` field with the `vMessage` type).
* `Thread` is the type of a thread returned from `continueThread` or `createThread`.
* `ThreadDoc` and `vThreadDoc` are the types for thread metadata.
* `AgentComponent` is the type of the installed component (e.g. `components.agent`).
* `ToolCtx` is the `ctx` type for calls to `createTool` tools.
# Streaming

Streaming messages is a great way to give a user feedback and keep an application feeling responsive while using LLMs.

Traditionally streaming happens via HTTP streaming, where the client sends a request and waits until the full response is streamed back. This works out of the box when using the Agent, in the same way you would with the AI SDK. See [below](#consuming-the-stream-yourself-with-the-agent) if that is all you're looking for.

However, with the Agent component you can also stream messages asynchronously, meaning the generation doesn't have to happen in an HTTP handler (`httpAction`), and the response can be streamed back to one or more clients even if their network connection is interrupted.

It works by saving the streaming parts to the database in groups (deltas), and the clients subscribe to new deltas for the given thread, as they're generated. As a bonus, you don't even need to use the Agent's version of `streamText` to use the delta streaming approach (see [below](#advanced-streaming-deltas-asynchronously-without-using-an-agent)).

Example:

* Server: [streaming.ts](https://github.com/get-convex/agent/blob/main/example/convex/chat/streaming.ts)
* Client: [ChatStreaming.tsx](https://github.com/get-convex/agent/blob/main/example/ui/chat/ChatStreaming.tsx)

## Streaming message deltas[​](#streaming-message-deltas "Direct link to Streaming message deltas")

The easiest way to stream is to pass `{ saveStreamDeltas: true }` to `agent.streamText`. This will save chunks of the response as deltas as they're generated, so all clients can subscribe to the stream and get live-updating text via normal Convex queries.

```
agent.streamText(ctx, { threadId }, { prompt }, { saveStreamDeltas: true });
```

This can be done in an async function, where http streaming to a client is not possible. Under the hood it will chunk up the response and debounce saving the deltas to prevent excessive bandwidth usage. You can pass more options to `saveStreamDeltas` to configure the chunking and debouncing.

```
  { saveStreamDeltas: { chunking: "line", throttleMs: 1000 } },
```

* `chunking` can be "word", "line", a regex, or a custom function.
* `throttleMs` is how frequently the deltas are saved. This will send multiple chunks per delta, writes sequentially, and will not write faster than the throttleMs ([single-flighted](https://stack.convex.dev/throttling-requests-by-single-flighting) ).

## Retrieving streamed deltas[​](#retrieving-streamed-deltas "Direct link to Retrieving streamed deltas")

For clients to stream messages, you need to expose a query that returns the stream deltas. This is very similar to [retrieving messages](/agents/messages.md#retrieving-messages), with a few changes:

```
import { paginationOptsValidator } from "convex/server";
import { vStreamArgs, listUIMessages, syncStreams } from "@convex-dev/agent";
import { components } from "./_generated/api";

export const listThreadMessages = query({
  args: {
    threadId: v.string(),
    // Pagination options for the non-streaming messages.
    paginationOpts: paginationOptsValidator,
    streamArgs: vStreamArgs,
  },
  handler: async (ctx, args) => {
    await authorizeThreadAccess(ctx, threadId);

    // Fetches the regular non-streaming messages.
    const paginated = await listUIMessages(ctx, components.agent, args);

    const streams = await syncStreams(ctx, components.agent, args);

    return { ...paginated, streams };
  },
});
```

Similar to with [non-streaming messages](/agents/messages.md#useuimessages-hook), you can use the `useUIMessages` hook to fetch the messages, passing in `stream: true` to enable streaming.

```
const { results, status, loadMore } = useUIMessages(
  api.chat.streaming.listMessages,
  { threadId },
  { initialNumItems: 10, stream: true },
);
```

### Text smoothing with `SmoothText` and `useSmoothText`[​](#text-smoothing-with-smoothtext-and-usesmoothtext "Direct link to text-smoothing-with-smoothtext-and-usesmoothtext")

The `useSmoothText` hook is a simple hook that smooths the text as it changes. It can work with any text, but is especially handy for streaming text.

```
import { useSmoothText } from "@convex-dev/agent/react";

// in the component
const [visibleText] = useSmoothText(message.text);
```

You can configure the initial characters per second. It will adapt over time to match the average speed of the text coming in.

By default it won't stream the first text it receives unless you pass in `startStreaming: true`. To start streaming immediately when you have a mix of streaming and non-streaming messages, do:

```
import { useSmoothText, type UIMessage } from "@convex-dev/agent/react";

function Message({ message }: { message: UIMessage }) {
  const [visibleText] = useSmoothText(message.text, {
    startStreaming: message.status === "streaming",
  });
  return <div>{visibleText}</div>;
}
```

If you don't want to use the hook, you can use the `SmoothText` component.

```
import { SmoothText } from "@convex-dev/agent/react";

//...
<SmoothText text={message.text} />;
```

## Consuming the stream yourself with the Agent[​](#consuming-the-stream-yourself-with-the-agent "Direct link to Consuming the stream yourself with the Agent")

You can consume the stream in all the ways you can with the underlying AI SDK - for instance iterating over the content, or using [`result.toDataStreamResponse()`](https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text#to-data-stream-response).

If you are not also saving the deltas, it might look like this:

```
const result = await agent.streamText(ctx, { threadId }, { prompt });

for await (const textPart of result.textStream) {
  console.log(textPart);
}
```

If you want to both iterate as the stream is happening, as well as save the deltas, you can pass `{ saveStreamDeltas: { returnImmediately: true } }` to `streamText`. This will return immediately, and you can then iterate over the stream live, or return the stream in an HTTP Response.

```
const result = await agent.streamText(
  ctx,
  { threadId },
  { prompt },
  { saveStreamDeltas: { returnImmediately: true } },
);

return result.toUIMessageStreamResponse();
```

If you don't want to have the Agent involved at all, the next section will show you how to save the deltas yourself.

## Advanced: Streaming deltas asynchronously without using an Agent[​](#advanced-streaming-deltas-asynchronously-without-using-an-agent "Direct link to Advanced: Streaming deltas asynchronously without using an Agent")

To stream messages without using the Agent's wrapper of `streamText`, you can use the `streamText` function from the AI SDK directly.

It consists of using the `DeltaStreamer` class to save the deltas to the database, and then using the above approach to retrieve the messages, though you can use a more direct `useStreamingUIMessages` hook that doesn't involve reading any non-streaming messages from the database.

The requirements for reading and writing the streams are just that they use a `threadId` from the Agent component, and that each stream is saved with a distinct `order`, for ordering on the client side.

```
import { components } from "./_generated/api";
import { type ActionCtx } from "./_generated/server";
import { DeltaStreamer, compressUIMessageChunks } from "@convex-dev/agent";
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";

async function stream(ctx: ActionCtx, threadId: string, order: number) {
  const streamer = new DeltaStreamer(
    components.agent,
    ctx,
    {
      throttleMs: 100,
      onAsyncAbort: async () => console.error("Aborted asynchronously"),
      // This will collapse multiple tiny deltas into one if they're being sent
      // in quick succession.
      compress: compressUIMessageChunks,
      abortSignal: undefined,
    },
    {
      threadId,
      format: "UIMessageChunk",
      order,
      stepOrder: 0,
      userId: undefined,
    },
  );
  // Do the normal streaming with the AI SDK
  const response = streamText({
    model: openai.chat("gpt-4o-mini"),
    prompt: "Tell me a joke",
    abortSignal: streamer.abortController.signal,
    onError: (error) => {
      console.error(error);
      streamer.fail(errorToString(error.error));
    },
  });

  // We could await here if we wanted to wait for the stream to finish,
  // but instead we have it process asynchronously so we can return a streaming
  // http Response.
  void streamer.consumeStream(response.toUIMessageStream());

  return {
    // e.g. to do `response.toTextStreamResponse()` for HTTP streaming.
    response,
    // We don't need this on the client, but with it we can have some clients
    // selectively not stream down deltas when they're using HTTP streaming
    // already.
    streamId: await streamer.getStreamId(),
  };
}
```

To fetch the deltas for the client, you can use the `syncStreams` function, as you would with normal Agent streaming. If you don't want to fetch the non-streaming messages, it can be simplified to:

```
import { v } from "convex/values";
import { vStreamArgs, syncStreams } from "@convex-dev/agent";
import { query } from "./_generated/server";
import { components } from "./_generated/api";

export const listStreams = query({
  args: {
    threadId: v.string(),
    streamArgs: vStreamArgs,
  },
  handler: async (ctx, args) => {
    // await authorizeThreadAccess(ctx, args.threadId);
    const streams = await syncStreams(ctx, components.agent, {
      ...args,
      // By default syncStreams only returns streaming messages. However, if
      // your messages aren't saved in the same transaction as the streaming
      // ends, you might want to include them here to avoid UI flashes.
      includeStatuses: ["streaming", "aborted", "finished"],
    });
    return { streams };
  },
});
```

On the client side, you can use the `useStreamingUIMessages` hook to fetch the messages. If you defined more arguments than just `threadId`, they'll get passed along with `threadId` here.

```
const messages = useStreamingUIMessages(api.example.listStreams, { threadId });
```

You can pass in another parameter to either skip certain `streamId`s or to start at some `order` to ignore previous streams.
# Tools

The Agent component supports tool calls, which are a way to allow an LLM to call out to external services or functions. This can be useful for:

* Retrieving data from the database
* Writing or updating data in the database
* Searching the web for more context
* Calling an external API
* Requesting that a user takes an action before proceeding (human-in-the-loop)

## Defining tools[​](#defining-tools "Direct link to Defining tools")

You can provide tools at different times:

* Agent constructor: (`new Agent(components.agent, { tools: {...} })`)
* Creating a thread: `createThread(ctx, { tools: {...} })`
* Continuing a thread: `continueThread(ctx, { tools: {...} })`
* On thread functions: `thread.generateText({ tools: {...} })`
* Outside of a thread: `supportAgent.generateText(ctx, {}, { tools: {...} })`

Specifying tools at each layer will overwrite the defaults. The tools will be `args.tools ?? thread.tools ?? agent.options.tools`. This allows you to create tools in a context that is convenient.

## Using tools[​](#using-tools "Direct link to Using tools")

The Agent component will automatically handle passing tool call results back in and re-generating if you pass `stopWhen: stepCountIs(num)` where `num > 1` to `generateText` or `streamText`.

The tool call and result will be stored as messages in the thread associated with the source message. See [Messages](/agents/messages.md) for more details.

## Creating a tool with a Convex context[​](#creating-a-tool-with-a-convex-context "Direct link to Creating a tool with a Convex context")

There are two ways to create a tool that has access to the Convex context.

1. Use the `createTool` function, which is a wrapper around the AI SDK's `tool` function.

```
export const ideaSearch = createTool({
  description: "Search for ideas in the database",
  args: z.object({ query: z.string().describe("The query to search for") }),
  handler: async (ctx, args, options): Promise<Array<Idea>> => {
    // ctx has agent, userId, threadId, messageId
    // as well as ActionCtx properties like auth, storage, runMutation, and runAction
    const ideas = await ctx.runQuery(api.ideas.searchIdeas, {
      query: args.query,
    });
    console.log("found ideas", ideas);
    return ideas;
  },
});
```

2. Define tools at runtime in a context with the variables you want to use.

```
async function createTool(ctx: ActionCtx, teamId: Id<"teams">) {
  const myTool = tool({
    description: "My tool",
    parameters: z.object({...}).describe("The arguments for the tool"),
    execute: async (args, options): Promise<BarReturnType> => {
      return await ctx.runQuery(internal.foo.bar, args);
    },
  });
}
```

In both cases, the args and options match the underlying AI SDK's `tool` function.

If you run into type errors, ensure you're annotating the return type of the execute function, and if necessary, the return type of the `handler`s of any functions you call with `ctx.run*`.

Note: it's highly recommended to use zod with `.describe` to provide details about each parameter. This will be used to provide a description of the tool to the LLM.

### Adding custom context to tools[​](#adding-custom-context-to-tools "Direct link to Adding custom context to tools")

It's often useful to have extra metadata in the context of a tool.

By default, the context passed to a tool is a `ToolCtx` with:

* `agent` - the Agent instance calling it
* `userId` - the user ID associated with the call, if any
* `threadId` - the thread ID, if any
* `messageId` - the message ID of the prompt message passed to generate/stream.
* Everything in `ActionCtx`, such as `auth`, `storage`, `runQuery`, etc. Note: in scheduled functions, workflows, etc, the auth user will be `null`.

To add more fields to the context, you can pass a custom context to the call, such as `agent.generateText({ ...ctx, orgId: "123" })`.

You can enforce the type of the context by passing a type when constructing the Agent.

```
const myAgent = new Agent<{ orgId: string }>(...);
```

Then, in your tools, you can use the `orgId` field.

```
type MyCtx = ToolCtx & { orgId: string };

const myTool = createTool({
  args: z.object({ ... }),
  description: "...",
  handler: async (ctx: MyCtx, args) => {
    // use ctx.orgId
  },
});
```

## Using an LLM or Agent as a tool[​](#using-an-llm-or-agent-as-a-tool "Direct link to Using an LLM or Agent as a tool")

You can do generation within a tool call, for instance if you wanted one Agent to ask another Agent a question.

Note: you don't have to structure agents calling each other as tool calls. You could instead decide which Agent should respond next based on other context and have many Agents contributing in the same thread.

The simplest way to model Agents as tool calls is to have each tool call work in an independent thread, or do generation without a thread at all. Then, the output is returned as the tool call result for the next LLM step to use. When you do it this way, you **don't** need to explicitly save the tool call result to the parent thread.

### Direct LLM generation without a thread:[​](#direct-llm-generation-without-a-thread "Direct link to Direct LLM generation without a thread:")

```
const llmTool = createTool({
  description: "Ask a question to some LLM",
  args: z.object({
    message: z.string().describe("The message to ask the LLM"),
  }),
  handler: async (ctx, args): Promise<string> => {
    const result = await generateText({
      system: "You are a helpful assistant.",
      // Pass through all messages from the current generation
      prompt: [...options.messages, { role: "user", content: args.message }],
      model: myLanguageModel,
    });
    return result.text;
  },
});
```

### Using an Agent as a tool[​](#using-an-agent-as-a-tool "Direct link to Using an Agent as a tool")

```
const agentTool = createTool({
  description: `Ask a question to agent ${agent.name}`,
  args: z.object({
    message: z.string().describe("The message to ask the agent"),
  }),
  handler: async (ctx, args, options): Promise<string> => {
    const { userId } = ctx;
    const { thread } = await agent.createThread(ctx, { userId });
    const result = await thread.generateText(
      {
        // Pass through all messages from the current generation
        prompt: [...options.messages, { role: "user", content: args.message }],
      },
      // Save all the messages from the current generation to this thread.
      { storageOptions: { saveMessages: "all" } },
    );
    // Optionally associate the child thread with the parent thread in your own
    // tables.
    await saveThreadAsChild(ctx, ctx.threadId, thread.threadId);
    return result.text;
  },
});
```
# LLM Context

By default, the Agent will provide context based on the message history of the thread. This context is used to generate the next message.

The context can include recent messages, as well as messages found via text and /or vector search.

If a `promptMessageId` is provided, the context will include that message, as well as any other messages on that same `order`. More details on order are in [messages.mdx](/agents/messages.md#message-ordering), but in practice this means that if you pass the ID of the user-submitted message as the `promptMessageId` and there had already been some assistant and/or tool responses, those will be included in the context, allowing the LLM to continue the conversation.

You can also use [RAG](/agents/rag.md) to add extra context to your prompt.

## Customizing the context[​](#customizing-the-context "Direct link to Customizing the context")

You can customize the context provided to the agent when generating messages with custom `contextOptions`. These can be set as defaults on the `Agent`, or provided at the call-site for `generateText` or others.

```
const result = await agent.generateText(
  ctx,
  { threadId },
  { prompt },
  {
    // Values shown are the defaults.
    contextOptions: {
      // Whether to exclude tool messages in the context.
      excludeToolMessages: true,
      // How many recent messages to include. These are added after the search
      // messages, and do not count against the search limit.
      recentMessages: 100,
      // Options for searching messages via text and/or vector search.
      searchOptions: {
        limit: 10, // The maximum number of messages to fetch.
        textSearch: false, // Whether to use text search to find messages.
        vectorSearch: false, // Whether to use vector search to find messages.
        // Note, this is after the limit is applied.
        // E.g. this will quadruple the number of messages fetched.
        // (two before, and one after each message found in the search)
        messageRange: { before: 2, after: 1 },
      },
      // Whether to search across other threads for relevant messages.
      // By default, only the current thread is searched.
      searchOtherThreads: false,
    },
  },
);
```

## Full context control[​](#full-context-control "Direct link to Full context control")

To have full control over which messages are passed to the LLM, you can either:

1. Provide a `contextHandler` to filter, modify, or enrich the context messages.
2. Provide all messages manually via the `messages` argument and specify `contextOptions` to use no recent or search messages. See below for how to fetch context messages manually.

### Providing a contextHandler[​](#providing-a-contexthandler "Direct link to Providing a contextHandler")

The Agent will combine messages from search, recent, input messages, and all messages on the same `order` as the `promptMessageId` if that is provided.

You can customize how they are combined, as well as add or remove messages by providing a `contextHandler` which returns the `ModelMessage[]` which will be passed to the LLM.

You can specify a `contextHandler` in the Agent constructor, or at the call-site for a single generation, which overrides any Agent default.

```
const myAgent = new Agent(components.agent, {
  ///...
  contextHandler: async (ctx, args) => {
    // This is the default behavior.
    return [
      ...args.search,
      ...args.recent,
      ...args.inputMessages,
      ...args.inputPrompt,
      ...args.existingResponses,
    ];
    // Equivalent to:
    return args.allMessages;
  },
);
```

With this callback, you can:

1. Filter out messages you don't want to include.
2. Add memories or other context.
3. Add sample messages to guide the LLM on how it should respond.
4. Inject extra context based on the user or thread.
5. Copy in messages from other threads.
6. Summarize messages.

For example:

```
// Note: when you specify it at the call-site, you can also leverage variables
// available in the scope, e.g. if the user is in a specific step in a workflow.
const result = await agent.generateText(
  ctx,
  { threadId },
  { prompt },
  {
    contextHandler: async (ctx, args) => {
      // Filter out messages that are not relevant.
      const relevantSearch = args.search.filter((m) => messageIsRelevant(m));
      // Fetch user memories to include in every prompt.
      const userMemories = await getUserMemories(ctx, args.userId);
      // Fetch sample messages to instruct the LLM on how to respond.
      const sampleMessages = [
        { role: "user", content: "Generate a function that adds two numbers" },
        { role: "assistant", content: "function add(a, b) { return a + b; }" },
      ];
      // Fetch user context to include in every prompt.
      const userContext = await getUserContext(ctx, args.userId, args.threadId);
      // Fetch messages from a related / parent thread.
      const related = await getRelatedThreadMessages(ctx, args.threadId);
      return [
        // Summarize or truncate context messages if they are too long.
        ...(await summarizeOrTruncateIfTooLong(related)),
        ...relevantSearch,
        ...userMemories,
        ...sampleMessages,
        ...userContext,
        ...args.recent,
        ...args.inputMessages,
        ...args.inputPrompt,
        ...args.existingResponses,
      ];
    },
  },
);
```

### Fetch context manually[​](#fetch-context-manually "Direct link to Fetch context manually")

If you want to get context messages for a given prompt, without calling the LLM, you can use `fetchContextWithPrompt`. This is used internally to get the context messages passed to the AI SDK `generateText`, `streamText`, etc.

As with normal generation, you can provide a `prompt` or `messages`, and/or a `promptMessageId` to fetch the context messages using a given pre-saved message as the prompt.

This will return recent and search messages combined with the input messages.

```
import { fetchContextWithPrompt } from "@convex-dev/agent";

const { messages } = await fetchContextWithPrompt(ctx, components.agent, {
  prompt,
  messages,
  promptMessageId,
  userId,
  threadId,
  contextOptions,
});
```

## Search for messages[​](#search-for-messages "Direct link to Search for messages")

This is what the agent does automatically, but it can be useful to do manually, e.g. to find custom context to include.

For text and vector search, you can provide a `targetMessageId` and/or `searchText`. It will embed the text for vector search. If `searchText` is not provided, it will use the target message's text.

If `targetMessageId` is provided, it will only fetch search messages previous to that message, and recent messages up to and including that message's "order". This enables re-generating a response for an earlier message.

```
import type { MessageDoc } from "@convex-dev/agent";

const messages: MessageDoc[] = await agent.fetchContextMessages(ctx, {
  threadId,
  searchText: prompt, // Optional unless you want text/vector search.
  targetMessageId: promptMessageId, // Optionally target the search.
  userId, // Optional, unless `searchOtherThreads` is true.
  contextOptions, // Optional, defaults are used if not provided.
});
```

Note: you can also search for messages without an agent. The main difference is that in order to do vector search, you need to create the embeddings yourself, and it will not run your usage handler.

```
import { fetchRecentAndSearchMessages } from "@convex-dev/agent";

const { recentMessages, searchMessages } = await fetchRecentAndSearchMessages(
  ctx,
  components.agent,
  {
    threadId,
    searchText: prompt, // Optional unless you want text/vector search.
    targetMessageId: promptMessageId, // Optionally target the search.
    contextOptions, // Optional, defaults are used if not provided.
    getEmbedding: async (text) => {
      const embedding = await textEmbeddingModel.embed(text);
      return { embedding, textEmbeddingModel };
    },
  },
);
```

## Searching other threads[​](#searching-other-threads "Direct link to Searching other threads")

If you set `searchOtherThreads` to `true`, the agent will search across all threads belonging to the provided `userId`. This can be useful to have multiple conversations that the Agent can reference.

The search will use a hybrid of text and vector search.

## Passing in messages as context[​](#passing-in-messages-as-context "Direct link to Passing in messages as context")

You can pass in messages as context to the Agent's LLM, for instance to implement [Retrieval-Augmented Generation](/agents/rag.md). The final messages sent to the LLM will be:

1. The system prompt, if one is provided or the agent has `instructions`
2. The messages found via contextOptions
3. The `messages` argument passed into `generateText` or other function calls.
4. If a `prompt` argument was provided, a final `{ role: "user", content: prompt }` message.

This allows you to pass in messages that are not part of the thread history and will not be saved automatically, but that the LLM will receive as context.

## Manage embeddings manually[​](#manage-embeddings-manually "Direct link to Manage embeddings manually")

The `textEmbeddingModel` argument to the Agent constructor allows you to specify a text embedding model to use for vector search.

If you set this, the agent will automatically generate embeddings for messages and use them for vector search.

When you change models or decide to start or stop using embeddings for vector search, you can manage the embeddings manually.

Generate embeddings for a set of messages. Optionally pass `config` with a usage handler, which can be a globally shared `Config`.

```
import { embedMessages } from "@convex-dev/agent";

const embeddings = await embedMessages(
  ctx,
  { userId, threadId, textEmbeddingModel, ...config },
  [{ role: "user", content: "What is love?" }],
);
```

Generate and save embeddings for existing messages.

```
const embeddings = await supportAgent.generateAndSaveEmbeddings(ctx, {
  messageIds,
});
```

Get and update embeddings, e.g. for a migration to a new model.

```
const messages = await ctx.runQuery(components.agent.vector.index.paginate, {
  vectorDimension: 1536,
  targetModel: "gpt-4o-mini",
  cursor: null,
  limit: 10,
});
```

Updating the embedding by ID.

```
const messages = await ctx.runQuery(components.agent.vector.index.updateBatch, {
  vectors: [{ model: "gpt-4o-mini", vector: embedding, id: msg.embeddingId }],
});
```

Note: If the dimension changes, you need to delete the old and insert the new.

Delete embeddings

```
await ctx.runMutation(components.agent.vector.index.deleteBatch, {
  ids: [embeddingId1, embeddingId2],
});
```

Insert embeddings

```
const ids = await ctx.runMutation(components.agent.vector.index.insertBatch, {
  vectorDimension: 1536,
  vectors: [
    {
      model: "gpt-4o-mini",
      table: "messages",
      userId: "123",
      threadId: "123",
      vector: embedding,
      // Optional, if you want to update the message with the embeddingId
      messageId: messageId,
    },
  ],
});
```
# Workflows

Agentic Workflows can be decomposed into two elements:

1. Prompting an LLM (including message history, context, etc.).
2. Deciding what to do with the LLM's response.

We generally call them workflows when there are multiple steps involved, they involve dynamically deciding what to do next, are long-lived, or have a mix of business logic and LLM calls.

Tool calls and MCP come into play when the LLM's response is a specific request for an action to take. The list of available tools and result of the calls are used in the prompt to the LLM.

One especially powerful form of Workflows are those that can be modeled as [durable functions](https://stack.convex.dev/durable-workflows-and-strong-guarantees) that can be long-lived, survive server restarts, and have strong guarantees around retrying, idempotency, and completing.

The simplest version of this could be doing a couple pre-defined steps, such as first getting the weather forecast, then getting fashion advice based on the weather. For a code example, see [workflows/chaining.ts](https://github.com/get-convex/agent/blob/main/example/convex/workflows/chaining.ts).

```
export const getAdvice = action({
  args: { location: v.string(), threadId: v.string() },
  handler: async (ctx, { location, threadId }) => {
    // This uses tool calls to get the weather forecast.
    await weatherAgent.generateText(
      ctx,
      { threadId },
      { prompt: `What is the weather in ${location}?` },
    );
    // This includes previous message history from the thread automatically and
    // uses tool calls to get user-specific fashion advice.
    await fashionAgent.generateText(
      ctx,
      { threadId },
      { prompt: `What should I wear based on the weather?` },
    );
    // We don't need to return anything, since the messages are saved
    // automatically and clients will get the response via subscriptions.
  },
});
```

## Building reliable workflows[​](#building-reliable-workflows "Direct link to Building reliable workflows")

One common pitfall when working with LLMs is their unreliability. API providers have outages, and LLMs can be flaky. To build reliable workflows, you often need three properties:

1. Reliable retries
2. Load balancing
3. Durability and idempotency for multi-step workflows

Thankfully there are Convex components to leverage for these properties.

### Retries[​](#retries "Direct link to Retries")

By default, Convex mutations have these properties by default. However, calling LLMs require side-effects and using the network calls, which necessitates using actions. If you are only worried about retries, you can use the [Action Retrier](https://convex.dev/components/retrier) component.

However, keep reading, as the [Workpool](https://convex.dev/components/workpool) and [Workflow](https://convex.dev/components/workflow) components provide more robust solutions, including retries.

### Load balancing[​](#load-balancing "Direct link to Load balancing")

With long-running actions in a serverless environment, you may consume a lot of resources. And with tasks like ingesting data for RAG or other spiky workloads, there's a risk of running out of resources. To mitigate this, you can use the [Workpool](https://convex.dev/components/workpool) component. You can set a limit on the number of concurrent workers and add work asynchronously, with configurable retries and a callback to handle eventual success / failure.

However, if you also want to manage multi-step workflows, you should use the [Workflow](https://convex.dev/components/workflow) component, which also provides retries and load balancing out of the box.

### Durability and idempotency for multi-step workflows[​](#durability-and-idempotency-for-multi-step-workflows "Direct link to Durability and idempotency for multi-step workflows")

When doing multi-step workflows that can fail mid-way, you need to ensure that the workflow can be resumed from where it left off, without duplicating work. The [Workflow](https://convex.dev/components/workflow) builds on the [Workpool](https://convex.dev/components/workpool) to provide durable execution of long running functions with retries and delays.

Each step in the workflow is run, with the result recorded. Even if the server fails mid-way, it will resume with the latest incomplete step, with configurable retry settings.

## Using the Workflow component for long-lived durable workflows[​](#using-the-workflow-component-for-long-lived-durable-workflows "Direct link to Using the Workflow component for long-lived durable workflows")

The [Workflow component](https://convex.dev/components/workflow) is a great way to build long-lived, durable workflows. It handles retries and guarantees of eventually completing, surviving server restarts, and more. Read more about durable workflows in [this Stack post](https://stack.convex.dev/durable-workflows-and-strong-guarantees).

To use the agent alongside workflows, you can run individual idempotent steps that the workflow can run, each with configurable retries, with guarantees that the workflow will eventually complete. Even if the server crashes mid-workflow, the workflow will pick up from where it left off and run the next step. If a step fails and isn't caught by the workflow, the workflow's onComplete handler will get the error result.

### Exposing the agent as Convex actions[​](#exposing-the-agent-as-convex-actions "Direct link to Exposing the agent as Convex actions")

You can expose the agent's capabilities as Convex functions to be used as steps in a workflow.

To create a thread as a standalone mutation, similar to `createThread`:

```
export const createThread = supportAgent.createThreadMutation();
```

For an action that generates text in a thread, similar to `thread.generateText`:

```
export const getSupport = supportAgent.asTextAction({
  stopWhen: stepCountIs(10),
});
```

You can also expose a standalone action that generates an object.

```
export const getStructuredSupport = supportAgent.asObjectAction({
  schema: z.object({
    analysis: z.string().describe("A detailed analysis of the user's request."),
    suggestion: z.string().describe("A suggested action to take."),
  }),
});
```

To save messages explicitly as a mutation, similar to `agent.saveMessages`:

```
export const saveMessages = supportAgent.asSaveMessagesMutation();
```

This is useful for idempotency, as you can first create the user's message, then generate a response in an unreliable action with retries, passing in the existing messageId instead of a prompt.

### Using the agent actions within a workflow[​](#using-the-agent-actions-within-a-workflow "Direct link to Using the agent actions within a workflow")

You can use the [Workflow component](https://convex.dev/components/workflow) to run agent flows. It handles retries and guarantees of eventually completing, surviving server restarts, and more. Read more about durable workflows [in this Stack post](https://stack.convex.dev/durable-workflows-and-strong-guarantees).

```
const workflow = new WorkflowManager(components.workflow);

export const supportAgentWorkflow = workflow.define({
  args: { prompt: v.string(), userId: v.string() },
  handler: async (step, { prompt, userId }) => {
    const { threadId } = await step.runMutation(internal.example.createThread, {
      userId,
      title: "Support Request",
    });
    const suggestion = await step.runAction(internal.example.getSupport, {
      threadId,
      userId,
      prompt,
    });
    const { object } = await step.runAction(
      internal.example.getStructuredSupport,
      {
        userId,
        message: suggestion,
      },
    );
    await step.runMutation(internal.example.sendUserMessage, {
      userId,
      message: object.suggestion,
    });
  },
});
```

See the code in [workflows/chaining.ts](https://github.com/get-convex/agent/blob/main/example/convex/workflows/chaining.ts).

## Complex workflow patterns[​](#complex-workflow-patterns "Direct link to Complex workflow patterns")

While there is only an example of a simple workflow here, there are many complex patterns that can be built with the Agent component:

* Dynamic routing to agents based on an LLM call or vector search
* Fanning out to LLM calls, then combining the results
* Orchestrating multiple agents
* Cycles of Reasoning and Acting (ReAct)
* Modeling a network of agents messaging each other
* Workflows that can be paused and resumed

<!-- -->

[Convex Component](https://www.convex.dev/components/workpool)

### [Workpool](https://www.convex.dev/components/workpool)

[Builds on the Action Retrier to provide parallelism limits and retries to manage large numbers of external requests efficiently.](https://www.convex.dev/components/workpool)

[Convex Component](https://www.convex.dev/components/workflow)

### [Workflow](https://www.convex.dev/components/workflow)

[Builds on the Workpool to provide durable execution of long running functions with retries and delays.](https://www.convex.dev/components/workflow)
# Human Agents

The Agent component generally takes a prompt from a human or agent, and uses an LLM to generate a response.

However, there are cases where you want to generate the reply from a human acting as an agent, such as for customer support.

For full code, check out [chat/human.ts](https://github.com/get-convex/agent/blob/main/example/convex/chat/human.ts)

## Saving a user message without generating a reply[​](#saving-a-user-message-without-generating-a-reply "Direct link to Saving a user message without generating a reply")

You can save a message from a user without generating a reply by using the `saveMessage` function.

```
import { saveMessage } from "@convex-dev/agent";
import { components } from "./_generated/api";

await saveMessage(ctx, components.agent, {
  threadId,
  prompt: "The user message",
});
```

## Saving a message from a human as an agent[​](#saving-a-message-from-a-human-as-an-agent "Direct link to Saving a message from a human as an agent")

Similarly, you can save a message from a human as an agent in the same way, using the `message` field to specify the role and agent name:

```
import { saveMessage } from "@convex-dev/agent";
import { components } from "./_generated/api";

await saveMessage(ctx, components.agent, {
  threadId,
  agentName: "Alex",
  message: { role: "assistant", content: "The human reply" },
});
```

## Storing additional metadata about human agents[​](#storing-additional-metadata-about-human-agents "Direct link to Storing additional metadata about human agents")

You can store additional metadata about human agents by using the `saveMessage` function, and adding the `metadata` field.

```
await saveMessage(ctx, components.agent, {
  threadId,
  agentName: "Alex",
  message: { role: "assistant", content: "The human reply" },
  metadata: {
    provider: "human",
    providerMetadata: {
      human: {
        /* ... */
      },
    },
  },
});
```

## Deciding who responds next[​](#deciding-who-responds-next "Direct link to Deciding who responds next")

You can choose whether the LLM or human responds next in a few ways:

1. Explicitly store in the database whether the user or LLM is assigned to the thread.
2. Using a call to a cheap and fast LLM to decide if the user question requires a human response.
3. Using vector embeddings of the user question and message history to make the decision, based on a corpus of sample questions and what questions are better handled by humans.
4. Have the LLM generate an object response that includes a field indicating whether the user question requires a human response.
5. Providing a tool to the LLM to decide if the user question requires a human response. The human response is then the tool response message.

## Human responses as tool calls[​](#human-responses-as-tool-calls "Direct link to Human responses as tool calls")

You can have the LLM generate a tool call to a human agent to provide context to answer the user question by providing a tool that doesn't have a handler. Note: this generally happens when the LLM still intends to answer the question, but needs human intervention to do so, such as confirmation of a fact.

```
import { tool } from "ai";
import { z } from "zod/v3";

const askHuman = tool({
  description: "Ask a human a question",
  parameters: z.object({
    question: z.string().describe("The question to ask the human"),
  }),
});

export const ask = action({
  args: { question: v.string(), threadId: v.string() },
  handler: async (ctx, { question, threadId }) => {
    const result = await agent.generateText(
      ctx,
      { threadId },
      {
        prompt: question,
        tools: { askHuman },
      },
    );
    const supportRequests = result.toolCalls
      .filter((tc) => tc.toolName === "askHuman")
      .map(({ toolCallId, args: { question } }) => ({
        toolCallId,
        question,
      }));
    if (supportRequests.length > 0) {
      // Do something so the support agent knows they need to respond,
      // e.g. save a message to their inbox
      // await ctx.runMutation(internal.example.sendToSupport, {
      //   threadId,
      //   supportRequests,
      // });
    }
  },
});

export const humanResponseAsToolCall = internalAction({
  args: {
    humanName: v.string(),
    response: v.string(),
    toolCallId: v.string(),
    threadId: v.string(),
    messageId: v.string(),
  },
  handler: async (ctx, args) => {
    await agent.saveMessage(ctx, {
      threadId: args.threadId,
      message: {
        role: "tool",
        content: [
          {
            type: "tool-result",
            result: args.response,
            toolCallId: args.toolCallId,
            toolName: "askHuman",
          },
        ],
      },
      metadata: {
        provider: "human",
        providerMetadata: {
          human: { name: args.humanName },
        },
      },
    });
    // Continue generating a response from the LLM
    await agent.generateText(
      ctx,
      { threadId: args.threadId },
      {
        promptMessageId: args.messageId,
      },
    );
  },
});
```
