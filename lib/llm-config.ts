export type LLMProvider = "azure-openai" | "openai" | "anthropic" | "compatible";

export interface LLMConfig {
  provider: LLMProvider;
  endpoint: string;
  apiKey: string;
  model: string;
  apiVersion?: string;
}

export const PROVIDER_OPTIONS: Array<{
  id: LLMProvider;
  label: string;
  desc: string;
  endpointPlaceholder: string;
  needsEndpoint: boolean;
  modelPlaceholder: string;
}> = [
  {
    id: "azure-openai",
    label: "Azure OpenAI",
    desc: "Microsoft Azure 托管的 OpenAI 模型",
    endpointPlaceholder: "https://xxx.openai.azure.com",
    needsEndpoint: true,
    modelPlaceholder: "gpt-5",
  },
  {
    id: "openai",
    label: "OpenAI",
    desc: "OpenAI 官方 API",
    endpointPlaceholder: "https://api.openai.com/v1",
    needsEndpoint: false,
    modelPlaceholder: "gpt-4o",
  },
  {
    id: "compatible",
    label: "OpenAI 兼容",
    desc: "第三方 OpenAI 兼容接口 (DeepSeek, Moonshot, 中转站等)",
    endpointPlaceholder: "https://api.deepseek.com/v1",
    needsEndpoint: true,
    modelPlaceholder: "deepseek-chat",
  },
  {
    id: "anthropic",
    label: "Anthropic",
    desc: "Anthropic Claude API",
    endpointPlaceholder: "https://api.anthropic.com",
    needsEndpoint: false,
    modelPlaceholder: "claude-sonnet-4-20250514",
  },
];

const STORAGE_KEY = "coslide_llm_config";

export function loadLLMConfig(): LLMConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveLLMConfig(config: LLMConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function clearLLMConfig(): void {
  localStorage.removeItem(STORAGE_KEY);
}
