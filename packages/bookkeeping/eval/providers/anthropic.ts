import type { LLMProvider, ProviderRequest, ProviderResponse } from "../types.js";

const ENDPOINT = "https://api.anthropic.com/v1/messages";
const API_VERSION = "2023-06-01";

export const anthropicProvider: LLMProvider = {
  id: "anthropic",
  name: "Anthropic",
  available(): boolean {
    return !!process.env["ANTHROPIC_API_KEY"];
  },
  defaultModel(): string {
    return "claude-sonnet-4-5";
  },
  async complete(req: ProviderRequest): Promise<ProviderResponse> {
    const key = process.env["ANTHROPIC_API_KEY"];
    if (!key) throw new Error("ANTHROPIC_API_KEY not set");

    const start = Date.now();
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": API_VERSION,
      },
      body: JSON.stringify({
        model: req.model,
        max_tokens: 4096,
        system: req.systemText,
        messages: [{ role: "user", content: req.userText }],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`anthropic ${res.status}: ${body.slice(0, 300)}`);
    }

    const data = (await res.json()) as {
      content: Array<{ type: string; text?: string }>;
      usage?: { input_tokens?: number; output_tokens?: number };
    };
    const rawText = data.content
      .filter((b) => b.type === "text")
      .map((b) => b.text ?? "")
      .join("");

    return {
      rawText,
      inputTokens: data.usage?.input_tokens ?? null,
      outputTokens: data.usage?.output_tokens ?? null,
      latencyMs: Date.now() - start,
    };
  },
};
