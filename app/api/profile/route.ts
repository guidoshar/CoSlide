import { NextRequest, NextResponse } from "next/server";
import { AzureOpenAI } from "openai";

const SYSTEM_PROMPT = `你是一个用户画像分析助手。根据用户提供的信息，生成一段简洁的第三人称用户描述。

要求：
1. 用第三人称"用户"开头，但首句用引号包含用户的称呼，如：用户"小夏"是一位...
2. 包含：称呼、职业角色、行业领域、工作场景、演示文稿用途、风格偏好
3. 如果用户没有提到某方面，合理推断但不要编造具体细节
4. 控制在 80-150 字
5. 语言流畅自然，像是一份内部用户档案
6. 直接输出描述文字，不要 JSON 或 markdown

示例输出：
"用户"小夏"是一位在快消品行业工作的市场总监，专注于品牌策略与数字化转型。偏好简洁专业的演示风格，常用于向VP级别高管汇报季度业绩和战略规划。喜欢用数据驱动的叙事方式，注重可视化和图表。"`;

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
  const parts: string[] = [];
  if (name) {
    parts.push(`用户"${name}"`);
  } else {
    parts.push("用户");
  }
  if (profession) {
    parts.push(`是一位${profession}`);
  }
  if (preferences) {
    parts.push(`。${preferences}`);
  }
  if (parts.length === 1) {
    parts.push("尚未完善个人信息");
  }
  return parts.join("");
}
