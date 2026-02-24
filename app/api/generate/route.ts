import { NextRequest, NextResponse } from "next/server";
import { AzureOpenAI } from "openai";
import { STYLE_PRESETS, LANGUAGES } from "@/lib/presets";

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

function buildSystemPrompt(styleId: string, languageId: string): string {
  const style = STYLE_PRESETS.find((s) => s.id === styleId);
  const lang = LANGUAGES.find((l) => l.id === languageId);

  const parts = [BASE_PROMPT];

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
    const { prompt, style = "executive", language = "auto" } = body;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid prompt" },
        { status: 400 }
      );
    }

    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;

    if (!apiKey || !endpoint || !deployment) {
      return NextResponse.json(
        { error: "Azure OpenAI not configured. Set AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT, and AZURE_OPENAI_DEPLOYMENT in .env.local" },
        { status: 500 }
      );
    }

    const client = new AzureOpenAI({
      apiKey,
      endpoint,
      deployment,
      apiVersion: "2024-12-01-preview",
    });

    const systemPrompt = buildSystemPrompt(style, language);

    const completion = await client.chat.completions.create({
      model: deployment,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 128000,
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "Empty response from AI model" },
        { status: 502 }
      );
    }

    const parsed = JSON.parse(content);

    if (!parsed.presentation?.slides?.length) {
      return NextResponse.json(
        { error: "Invalid AI response structure" },
        { status: 502 }
      );
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("[/api/generate]", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
