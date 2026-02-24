export type OutputFormat = "pptx" | "html";

export interface StyleColors {
  dark: string;
  accent: string;
  title: string;
  body: string;
  muted: string;
  light: string;
  white: string;
  line: string;
}

export interface StylePreset {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  colors: StyleColors;
  promptFragment: string;
}

export interface LanguageOption {
  id: string;
  label: string;
  promptFragment: string;
}

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: "executive",
    name: "高管汇报",
    nameEn: "EXECUTIVE",
    description: "克制专业、数据驱动、VP 级战略视角",
    colors: {
      dark: "1B2A4A",
      accent: "2E5090",
      title: "0F1B33",
      body: "2C3E50",
      muted: "7F8C9B",
      light: "F0F2F5",
      white: "FFFFFF",
      line: "D1D5DB",
    },
    promptFragment: `STYLE DIRECTIVE — EXECUTIVE BRIEFING:
- Write from a C-suite strategic perspective. Every slide must answer "so what?" for a VP/SVP audience.
- Lead each slide with a decisive insight or recommendation, NOT a generic overview.
- Include specific metrics, KPIs, benchmarks, or quantified impact wherever possible (invent realistic placeholders like "~35% improvement" if the user doesn't provide data).
- Use frameworks: before/after comparisons, risk/opportunity matrices, ROI projections.
- Speaker notes should be a full 60-second executive talking track with transition phrases.
- Tone: authoritative, concise, no filler words, action-oriented.`,
  },
  {
    id: "creative",
    name: "创意提案",
    nameEn: "CREATIVE",
    description: "大胆观点、视觉化思维、现代冲击力",
    colors: {
      dark: "1A1A2E",
      accent: "E94560",
      title: "16213E",
      body: "2C2C54",
      muted: "8E8EA0",
      light: "FFF5F5",
      white: "FFFFFF",
      line: "E8D5D5",
    },
    promptFragment: `STYLE DIRECTIVE — CREATIVE PITCH:
- Open each slide with a bold, provocative statement or a "What if..." question that challenges assumptions.
- Use vivid analogies, metaphors, and unexpected comparisons to make complex ideas click.
- Structure content with rhythm: short punchy lines alternating with one detailed insight.
- Include "Imagine this..." scenarios that paint a concrete picture for the audience.
- Speaker notes should be conversational and energetic, as if pitching to an excited room.
- Tone: bold, inspiring, slightly irreverent, visually descriptive.`,
  },
  {
    id: "minimal",
    name: "极简学术",
    nameEn: "MINIMAL",
    description: "精炼至极、每词皆有信息量、学术级严谨",
    colors: {
      dark: "111111",
      accent: "333333",
      title: "000000",
      body: "222222",
      muted: "888888",
      light: "FAFAFA",
      white: "FFFFFF",
      line: "E0E0E0",
    },
    promptFragment: `STYLE DIRECTIVE — MINIMAL ACADEMIC:
- Maximum information density. Every word must earn its place — no adjectives unless they carry data.
- Use precise technical terminology appropriate to the domain.
- Structure bullets as "Claim + Evidence" pairs: e.g., "Retrieval latency reduced 40% (benchmark: MTEB, 2024)".
- Prefer numbered lists when showing sequential processes or ranked priorities.
- Speaker notes should provide scholarly depth: cite methodologies, reference industry standards, note caveats.
- Tone: precise, objective, understated authority.`,
  },
  {
    id: "storytelling",
    name: "叙事故事",
    nameEn: "STORY",
    description: "温暖叙事、情感共鸣、有趣引人入胜",
    colors: {
      dark: "2D2A26",
      accent: "6B4C3B",
      title: "1A1A1A",
      body: "333333",
      muted: "999999",
      light: "F4F1EA",
      white: "FFFFFF",
      line: "D4CFC7",
    },
    promptFragment: `STYLE DIRECTIVE — STORYTELLING:
- Structure the entire presentation as a narrative arc: Setup (problem/context) → Conflict (challenges/pain) → Resolution (solution/value) → Call to Adventure (next steps).
- Open with a relatable scenario or mini-story that the audience can see themselves in.
- Use "character-driven" framing: "Your team currently spends..." / "Imagine your customer..."
- Each slide should feel like the next chapter — include transitional hooks.
- Speaker notes should read like a spoken story with pauses, emphasis cues, and audience engagement moments.
- Tone: warm, engaging, human, occasionally playful.`,
  },
];

export const LANGUAGES: LanguageOption[] = [
  {
    id: "auto",
    label: "AUTO",
    promptFragment: "Match the language of the user's input. If Chinese, output Chinese. If English, output English. Etc.",
  },
  {
    id: "zh-CN",
    label: "中文",
    promptFragment: "Output ALL content (titles, body, notes) in Simplified Chinese (简体中文). No English unless it's a proper noun or technical term.",
  },
  {
    id: "en",
    label: "EN",
    promptFragment: "Output ALL content (titles, body, notes) in English.",
  },
  {
    id: "ja",
    label: "日本語",
    promptFragment: "Output ALL content (titles, body, notes) in Japanese (日本語).",
  },
];

export function getStyleById(id: string, colorOverrides?: Partial<StyleColors>): StylePreset {
  const preset = STYLE_PRESETS.find((s) => s.id === id) || STYLE_PRESETS[0];
  if (!colorOverrides || Object.keys(colorOverrides).length === 0) return preset;
  return {
    ...preset,
    colors: { ...preset.colors, ...colorOverrides },
  };
}

export function getLanguageById(id: string): LanguageOption {
  return LANGUAGES.find((l) => l.id === id) || LANGUAGES[0];
}
