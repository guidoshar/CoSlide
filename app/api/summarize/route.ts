import { NextRequest, NextResponse } from "next/server";
import { AzureOpenAI } from "openai";

const SYSTEM_PROMPT = `你是 CoSlide 的 AI 助手，一个温暖、友善、有点可爱的女孩形象。用户刚刚通过你生成了一份 PPT 演示文稿。

请你根据以下信息，用轻松友好的语气写一段总结（100-200字中文），包含：
1. 简要描述这份 PPT 的主题和核心亮点
2. 提到包含了多少页幻灯片，每页大概涵盖了什么
3. 给一些温馨的使用建议或鼓励
4. 语气要自然、温暖，像一个贴心的助手在跟用户聊天，可以用一些语气词

注意：直接输出总结文字，不要用 JSON 格式，不要用 markdown 格式。`;

function buildFallbackSummary(title: string, slideCount: number): string {
  return `你的演示文稿「${title}」已经生成好啦～一共 ${slideCount} 页，内容结构完整，可以直接下载使用哦！如果觉得某些地方需要调整，随时可以回来修改重新生成～加油！`;
}

export async function POST(request: NextRequest) {
  let title = "";
  let slideCount = 0;

  try {
    const { presentation, userPrompt, userProfile } = await request.json();

    title = presentation?.title || "演示文稿";
    slideCount = presentation?.slides?.length || 0;

    if (!presentation?.slides?.length) {
      return NextResponse.json(
        { summary: buildFallbackSummary(title, slideCount) }
      );
    }

    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;

    if (!apiKey || !endpoint || !deployment) {
      return NextResponse.json(
        { summary: buildFallbackSummary(title, slideCount) }
      );
    }

    const client = new AzureOpenAI({
      apiKey,
      endpoint,
      deployment,
      apiVersion: "2024-12-01-preview",
    });

    const slidesSummary = presentation.slides
      .map((s: { title: string }, i: number) => `第${i + 1}页: ${s.title}`)
      .join("\n");

    const profileContext = userProfile ? `\n用户画像：${userProfile}` : "";
    const userContent = `用户的原始需求：${userPrompt || "（未提供）"}${profileContext}

生成的 PPT 标题：${presentation.title}
共 ${presentation.slides.length} 页幻灯片：
${slidesSummary}`;

    const completion = await client.chat.completions.create({
      model: deployment,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
      max_completion_tokens: 1024,
    });

    const content = completion.choices[0]?.message?.content;

    return NextResponse.json({
      summary: content?.trim() || buildFallbackSummary(title, slideCount),
    });
  } catch (err) {
    console.error("[/api/summarize]", err);
    return NextResponse.json({
      summary: buildFallbackSummary(title, slideCount),
    });
  }
}
