export interface LLMRequest {
  systemPrompt?: string;
  prompt: string;
  temperature?: number;
  responseFormat?: "json" | "text";
}

export interface LLMProvider {
  name: string;
  generateText(req: LLMRequest): Promise<string>;
  generateJson<T>(req: LLMRequest): Promise<T>;
}

import { OpenAIProvider } from "./openai";
import { GeminiProvider } from "./gemini";
import { AnthropicProvider } from "./anthropic";

export function getProvider(name?: string): LLMProvider {
  const providerName = name || process.env.LLM_PROVIDER || "gemini";
  
  switch (providerName.toLowerCase()) {
    case "openai":
      return new OpenAIProvider();
    case "anthropic":
      return new AnthropicProvider();
    case "gemini":
    default:
      return new GeminiProvider();
  }
}
