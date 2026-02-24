import OpenAI from "openai";
import { AzureOpenAI } from "openai";
import type { LLMConfig } from "./llm-config";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string | Array<Record<string, unknown>>;
}

export function resolveConfig(requestConfig?: LLMConfig | null): LLMConfig | null {
  if (requestConfig?.apiKey && requestConfig?.model) {
    return requestConfig;
  }

  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;

  if (apiKey && endpoint && deployment) {
    return {
      provider: "azure-openai",
      apiKey,
      endpoint,
      model: deployment,
      apiVersion: "2024-12-01-preview",
    };
  }

  return null;
}

export async function chatCompletion(
  config: LLMConfig,
  messages: ChatMessage[],
  maxTokens: number = 4096,
): Promise<string> {
  if (config.provider === "anthropic") {
    return anthropicCompletion(config, messages, maxTokens);
  }

  const client = createOpenAIClient(config);
  const completion = await client.chat.completions.create({
    model: config.model,
    messages: messages as Parameters<typeof client.chat.completions.create>[0]["messages"],
    max_completion_tokens: maxTokens,
  });

  return completion.choices[0]?.message?.content || "";
}

export async function chatCompletionStream(
  config: LLMConfig,
  messages: ChatMessage[],
  maxTokens: number = 128000,
  jsonMode: boolean = false,
): Promise<AsyncIterable<string>> {
  if (config.provider === "anthropic") {
    return anthropicStream(config, messages, maxTokens);
  }

  const client = createOpenAIClient(config);

  const stream = await client.chat.completions.create({
    model: config.model,
    messages: messages as Parameters<typeof client.chat.completions.create>[0]["messages"],
    max_completion_tokens: maxTokens,
    stream: true as const,
    ...(jsonMode ? { response_format: { type: "json_object" as const } } : {}),
  });

  return {
    async *[Symbol.asyncIterator]() {
      for await (const chunk of stream as AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>) {
        const delta = chunk.choices[0]?.delta?.content;
        if (delta) yield delta;
      }
    },
  };
}

function createOpenAIClient(config: LLMConfig): OpenAI | AzureOpenAI {
  switch (config.provider) {
    case "azure-openai":
      return new AzureOpenAI({
        apiKey: config.apiKey,
        endpoint: config.endpoint,
        deployment: config.model,
        apiVersion: config.apiVersion || "2024-12-01-preview",
      });
    case "openai":
      return new OpenAI({ apiKey: config.apiKey });
    case "compatible":
      return new OpenAI({ apiKey: config.apiKey, baseURL: config.endpoint });
    default:
      throw new Error(`Unsupported OpenAI provider variant: ${config.provider}`);
  }
}

function convertMessagesForAnthropic(messages: ChatMessage[]) {
  const systemMsg = messages.find((m) => m.role === "system");
  const otherMsgs = messages.filter((m) => m.role !== "system");

  const convertedMessages = otherMsgs.map((m) => {
    if (typeof m.content === "string") {
      return { role: m.role, content: m.content };
    }
    const blocks = (m.content as Array<Record<string, unknown>>).map((block) => {
      if (block.type === "image_url") {
        const url = (block.image_url as Record<string, string>)?.url || "";
        const match = url.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          return {
            type: "image",
            source: { type: "base64", media_type: match[1], data: match[2] },
          };
        }
      }
      return block;
    });
    return { role: m.role, content: blocks };
  });

  return {
    system: typeof systemMsg?.content === "string" ? systemMsg.content : undefined,
    messages: convertedMessages,
  };
}

async function anthropicCompletion(
  config: LLMConfig,
  messages: ChatMessage[],
  maxTokens: number,
): Promise<string> {
  const { system, messages: converted } = convertMessagesForAnthropic(messages);
  const baseUrl = config.endpoint || "https://api.anthropic.com";

  const res = await fetch(`${baseUrl}/v1/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: maxTokens,
      ...(system ? { system } : {}),
      messages: converted,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      `Anthropic API error: ${(err as Record<string, Record<string, string>>).error?.message || res.statusText}`,
    );
  }

  const data = await res.json();
  return (data as { content: Array<{ text: string }> }).content?.[0]?.text || "";
}

async function* anthropicStreamGenerator(
  config: LLMConfig,
  messages: ChatMessage[],
  maxTokens: number,
): AsyncGenerator<string> {
  const { system, messages: converted } = convertMessagesForAnthropic(messages);
  const baseUrl = config.endpoint || "https://api.anthropic.com";

  const res = await fetch(`${baseUrl}/v1/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: maxTokens,
      stream: true,
      ...(system ? { system } : {}),
      messages: converted,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      `Anthropic API error: ${(err as Record<string, Record<string, string>>).error?.message || res.statusText}`,
    );
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const jsonStr = line.slice(6).trim();
      if (!jsonStr || jsonStr === "[DONE]") continue;

      try {
        const evt = JSON.parse(jsonStr);
        if (evt.type === "content_block_delta" && evt.delta?.text) {
          yield evt.delta.text;
        }
      } catch {
        /* skip malformed SSE chunks */
      }
    }
  }
}

function anthropicStream(
  config: LLMConfig,
  messages: ChatMessage[],
  maxTokens: number,
): AsyncIterable<string> {
  return {
    [Symbol.asyncIterator]() {
      return anthropicStreamGenerator(config, messages, maxTokens);
    },
  };
}
