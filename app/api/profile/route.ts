import { NextRequest, NextResponse } from "next/server";
import { AzureOpenAI } from "openai";

const SYSTEM_PROMPT = `你是一个用户画像分析助手。根据用户提供的信息，生成一段详细的第三人称用户描述档案。

要求：
1. 用 用户"称呼" 开头，如：用户"小夏"是一位...
2. 必须涵盖以下全部维度（即使用户未明确提及也要合理推断）：
   - 职业角色与行业领域
   - 日常工作中演示文稿的使用场景（给谁看、什么目的）
   - 偏好的演示风格（数据驱动/叙事型/视觉冲击/极简学术等）
   - 对内容深度的期望（概览型还是深入分析型）
   - 可能的审美偏好（色调、排版风格）
3. 控制在 150-250 字
4. 语言流畅自然，像是一份对用户深入了解后写出的内部档案
5. 直接输出描述文字，不要 JSON 或 markdown

示例输出：
用户"小夏"是一位 AI 解决方案架构师，深耕企业级人工智能落地领域，日常工作涉及技术方案设计、售前演示和客户沟通。演示文稿主要用于向客户高层（VP/CTO级别）展示技术架构和商业价值，也会在内部做技术分享和项目复盘。偏好简洁专业的演示风格，重视逻辑清晰和数据支撑，不喜欢过于花哨的装饰。对内容深度有较高要求，期望每页都有实质性的洞察而非泛泛而谈。审美上倾向沉稳的深色调搭配明确的强调色，排版讲究留白与信息密度的平衡。`;

export async function POST(request: NextRequest) {
  let name = "";
  let profession = "";
  let preferences = "";

  try {
    const body = await request.json();
    name = body.name || "";
    profession = body.profession || "";
    preferences = body.preferences || "";

    const inputParts: string[] = [];
    if (name) inputParts.push(`称呼：${name}`);
    if (profession) inputParts.push(`职业：${profession}`);
    if (preferences) inputParts.push(`使用场景与偏好：${preferences}`);

    const input = inputParts.join("\n");

    if (!input || input.length < 2) {
      return NextResponse.json(
        { error: "请至少提供一些信息" },
        { status: 400 }
      );
    }

    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;

    if (!apiKey || !endpoint || !deployment) {
      const fallback = buildFallbackProfile(name, profession, preferences);
      return NextResponse.json({ profile: fallback });
    }

    const client = new AzureOpenAI({
      apiKey,
      endpoint,
      deployment,
      apiVersion: "2024-12-01-preview",
    });

    const completion = await client.chat.completions.create({
      model: deployment,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: input },
      ],
      max_completion_tokens: 512,
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      const fallback = buildFallbackProfile(name, profession, preferences);
      return NextResponse.json({ profile: fallback });
    }

    return NextResponse.json({ profile: content.trim() });
  } catch (err) {
    console.error("[/api/profile]", err);
    const fallback = buildFallbackProfile(name, profession, preferences);
    return NextResponse.json({ profile: fallback });
  }
}

function buildFallbackProfile(name?: string, profession?: string, preferences?: string): string {
  const displayName = name ? `用户"${name}"` : "用户";

  if (!profession && !preferences) {
    return `${displayName}尚未完善个人信息，系统将使用通用的专业风格生成内容。`;
  }

  const parts: string[] = [displayName];

  if (profession) {
    parts.push(`是一位${profession}，`);
    parts.push("日常工作中需要制作各类演示文稿用于汇报和沟通。");
  }

  if (preferences) {
    parts.push(`关于使用偏好：${preferences}。`);
  }

  if (profession && !preferences) {
    parts.push("偏好专业简洁的演示风格，注重内容的逻辑性和信息密度。");
  }

  return parts.join("");
}
