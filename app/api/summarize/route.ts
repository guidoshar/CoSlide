import { NextRequest, NextResponse } from "next/server";
import { resolveConfig, chatCompletion } from "@/lib/llm-client";
import type { LLMConfig } from "@/lib/llm-config";

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
    const { presentation, userPrompt, userProfile, llmConfig: requestLLMConfig } = await request.json();

    title = presentation?.title || "演示文稿";
    slideCount = presentation?.slides?.length || 0;

    if (!presentation?.slides?.length) {
      return NextResponse.json({ summary: buildFallbackSummary(title, slideCount) });
    }

    const config = resolveConfig(requestLLMConfig as LLMConfig | undefined);
    if (!config) {
      return NextResponse.json({ summary: buildFallbackSummary(title, slideCount) });
    }

    const slidesSummary = presentation.slides
      .map((s: { title: string }, i: number) => `第${i + 1}页: ${s.title}`)
      .join("\n");

    const profileContext = userProfile ? `\n用户画像：${userProfile}` : "";
    const userContent = `用户的原始需求：${userPrompt || "（未提供）"}${profileContext}

生成的 PPT 标题：${presentation.title}
共 ${presentation.slides.length} 页幻灯片：
${slidesSummary}`;

    const content = await chatCompletion(
      config,
      [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
      1024,
    );

    return NextResponse.json({
      summary: content.trim() || buildFallbackSummary(title, slideCount),
    });
  } catch (err) {
    console.error("[/api/summarize]", err);
    return NextResponse.json({ summary: buildFallbackSummary(title, slideCount) });
  }
}
