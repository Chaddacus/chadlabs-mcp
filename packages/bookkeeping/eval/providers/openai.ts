import type { LLMProvider, ProviderRequest, ProviderResponse } from "../types.js";

const ENDPOINT = "https://api.openai.com/v1/chat/completions";

export const openaiProvider: LLMProvider = {
  id: "openai",
  name: "OpenAI",
  available(): boolean {
    return !!process.env["OPENAI_API_KEY"];
  },
  defaultModel(): string {
    return "gpt-4o-2024-11-20";
  },
  async complete(req: ProviderRequest): Promise<ProviderResponse> {
    const key = process.env["OPENAI_API_KEY"];
    if (!key) throw new Error("OPENAI_API_KEY not set");

    const start = Date.now();
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: req.model,
        max_tokens: 4096,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: req.systemText },
          { role: "user", content: req.userText },
        ],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`openai ${res.status}: ${body.slice(0, 300)}`);
    }

    const data = (await res.json()) as {
      choices: Array<{ message: { content: string | null } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };
    const rawText = data.choices[0]?.message.content ?? "";

    return {
      rawText,
      inputTokens: data.usage?.prompt_tokens ?? null,
      outputTokens: data.usage?.completion_tokens ?? null,
      latencyMs: Date.now() - start,
    };
  },
};
