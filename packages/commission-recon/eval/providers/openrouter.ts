import type { LLMProvider, ProviderRequest, ProviderResponse } from "../types.js";

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

export const openrouterProvider: LLMProvider = {
  id: "openrouter",
  name: "OpenRouter",
  available() {
    return !!process.env["OPENROUTER_API_KEY"];
  },
  defaultModel() {
    return "anthropic/claude-sonnet-4.5";
  },
  async complete(req: ProviderRequest): Promise<ProviderResponse> {
    const key = process.env["OPENROUTER_API_KEY"];
    if (!key) throw new Error("OPENROUTER_API_KEY not set");
    const start = Date.now();
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${key}`,
        "http-referer": "https://chadacus.dev",
        "x-title": "chadlabs-commission-recon eval",
      },
      body: JSON.stringify({
        model: req.model,
        max_tokens: 4096,
        messages: [
          { role: "system", content: req.systemText },
          { role: "user", content: req.userText },
        ],
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`openrouter ${res.status}: ${body.slice(0, 300)}`);
    }
    const data = (await res.json()) as {
      choices: Array<{ message: { content: string | null } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };
    return {
      rawText: data.choices[0]?.message.content ?? "",
      inputTokens: data.usage?.prompt_tokens ?? null,
      outputTokens: data.usage?.completion_tokens ?? null,
      latencyMs: Date.now() - start,
    };
  },
};
