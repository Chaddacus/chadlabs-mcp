import type { LLMProvider } from "../types.js";
import { anthropicProvider } from "./anthropic.js";
import { openaiProvider } from "./openai.js";
import { openrouterProvider } from "./openrouter.js";
import { ollamaProvider } from "./ollama.js";
import { lmstudioProvider } from "./lmstudio.js";

export const ALL_PROVIDERS: LLMProvider[] = [
  anthropicProvider,
  openaiProvider,
  openrouterProvider,
  ollamaProvider,
  lmstudioProvider,
];

export function findProvider(id: string): LLMProvider | undefined {
  return ALL_PROVIDERS.find((p) => p.id === id);
}

export function availableProviders(): LLMProvider[] {
  return ALL_PROVIDERS.filter((p) => p.available());
}
