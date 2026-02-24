import { NextRequest } from "next/server";
import { STYLE_PRESETS, LANGUAGES } from "@/lib/presets";
import { resolveConfig, chatCompletionStream } from "@/lib/llm-client";
import type { LLMConfig } from "@/lib/llm-config";

const BASE_PROMPT = `You are an elite presentation strategist who creates deeply insightful, well-structured slide decks. You do NOT produce generic overviews — every slide must contain SPECIFIC, ACTIONABLE, SUBSTANTIVE content.

OUTPUT FORMAT — STRICT JSON ONLY:
{
  "presentation": {
    "title": "Presentation Title",
    "slides": [
      {
        "title": "Slide Title — must be a clear takeaway, not a topic label",
        "body": ["Point 1 with specifics", "Point 2 with data/evidence", "Point 3 with insight"],
        "notes": "Full speaker talking track (60-90 seconds of spoken content per slide)"
      }
    ]
  }
}

CONTENT QUALITY RULES:
1. TITLES must be insight-driven, not topic labels. BAD: "市场概况". GOOD: "中国AI市场规模2025年将突破5000亿，企业知识管理是增长最快赛道".
2. BODY bullets must each contain a concrete fact, metric, example, comparison, or recommendation. NO vague statements like "提高效率" — instead: "检索响应时间从平均12秒降至0.8秒（提升93%）".
3. Each slide should have 3-5 bullets. Quality over quantity.
4. NOTES must be a complete speaker script — not just rephrased bullets. Include transitions ("接下来我们看看..."), emphasis cues, and audience engagement hooks.
5. SLIDE COUNT: Follow user's request, or default to 8 slides for comprehensive coverage.
6. STRUCTURE: Slide 1 = compelling hook + agenda. Slides 2-N-1 = logical progression with each building on the last. Final slide = decisive call-to-action with concrete next steps.
7. DEPTH: Act as if you are a domain expert. Research-quality content. If the topic is technical, use proper terminology. If business, use real frameworks (Porter's, SWOT, TAM/SAM/SOM, etc.).
8. NO FILLER. Every sentence must pass the test: "Does this tell the audience something they didn't already know?"`;

function buildSystemPrompt(styleId: string, languageId: string, userProfile?: string): string {
  const style = STYLE_PRESETS.find((s) => s.id === styleId);
  const lang = LANGUAGES.find((l) => l.id === languageId);

  const parts = [BASE_PROMPT];

  if (userProfile) {
    parts.push(`\nUSER CONTEXT: ${userProfile}\nTailor the presentation tone, depth, and examples to match this user's background and preferences.`);
  }

  if (style) {
    parts.push(`\n${style.promptFragment}`);
  }

  if (lang) {
    parts.push(`\nLANGUAGE DIRECTIVE: ${lang.promptFragment}`);
  }

  parts.push("\nRemember: Output ONLY the JSON object. No markdown, no code fences, no explanation text.");

  return parts.join("\n");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      prompt,
      style = "executive",
      language = "auto",
      userProfile,
      attachedFiles = [],
      llmConfig: requestLLMConfig,
    } = body;

    if (!prompt || typeof prompt !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid prompt" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const config = resolveConfig(requestLLMConfig as LLMConfig | undefined);
    if (!config) {
      return new Response(
        JSON.stringify({ error: "No LLM configured. Set environment variables or configure in Settings." }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const systemPrompt = buildSystemPrompt(style, language, userProfile);

    interface AttachedFilePayload {
      type: "text" | "image";
      content: string;
      fileName: string;
    }

    const textAttachments = (attachedFiles as AttachedFilePayload[])
      .filter((f) => f.type === "text" && f.content)
      .map((f) => `\n--- Attached file: ${f.fileName} ---\n${f.content}`)
      .join("\n");

    const imageAttachments = (attachedFiles as AttachedFilePayload[])
      .filter((f) => f.type === "image" && f.content);

    const userTextContent = textAttachments
      ? `${prompt}\n\nREFERENCE MATERIAL FROM UPLOADED FILES:${textAttachments}`
      : prompt;

    type MessageContent = string | Array<Record<string, unknown>>;

    let userContent: MessageContent;
    if (imageAttachments.length > 0) {
      userContent = [
        { type: "text", text: userTextContent },
        ...imageAttachments.map((img) => ({
          type: "image_url",
          image_url: { url: img.content },
        })),
      ];
    } else {
      userContent = userTextContent;
    }

    const messages = [
      { role: "system" as const, content: systemPrompt },
      { role: "user" as const, content: userContent },
    ];

    const isJsonCapable = config.provider !== "anthropic";

    const encoder = new TextEncoder();
    function sendSSE(data: Record<string, unknown>): Uint8Array {
      return encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
    }

    const readable = new ReadableStream({
      async start(controller) {
        try {
          controller.enqueue(sendSSE({ type: "stage", stage: "connecting" }));

          const stream = await chatCompletionStream(config, messages, 128000, isJsonCapable);

          controller.enqueue(sendSSE({ type: "stage", stage: "streaming" }));

          let fullContent = "";
          let tokenCount = 0;

          for await (const delta of stream) {
            fullContent += delta;
            tokenCount++;
            controller.enqueue(sendSSE({ type: "token", content: delta, count: tokenCount }));
          }

          controller.enqueue(sendSSE({ type: "stage", stage: "parsing" }));

          const parsed = JSON.parse(fullContent);

          if (!parsed.presentation?.slides?.length) {
            controller.enqueue(sendSSE({ type: "error", error: "Invalid AI response structure" }));
            controller.close();
            return;
          }

          controller.enqueue(sendSSE({
            type: "done",
            presentation: parsed.presentation,
            tokenCount,
          }));
        } catch (err) {
          const message = err instanceof Error ? err.message : "Stream error";
          console.error("[/api/generate stream]", err);
          controller.enqueue(sendSSE({ type: "error", error: message }));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("[/api/generate]", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
