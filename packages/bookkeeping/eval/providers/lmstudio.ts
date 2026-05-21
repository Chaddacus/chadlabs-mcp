import type { LLMProvider, ProviderRequest, ProviderResponse } from "../types.js";

function endpoint(): string {
  return process.env["LMSTUDIO_HOST"] ?? "http://127.0.0.1:1234";
}

export const lmstudioProvider: LLMProvider = {
  id: "lmstudio",
  name: "LM Studio (local)",
  available(): boolean {
    return !!(process.env["LMSTUDIO_AVAILABLE"] || process.env["LMSTUDIO_HOST"]);
  },
  defaultModel(): string {
    return process.env["LMSTUDIO_MODEL"] ?? "local-model";
  },
  async complete(req: ProviderRequest): Promise<ProviderResponse> {
    const start = Date.now();
    const res = await fetch(`${endpoint()}/v1/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json" },
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
      throw new Error(`lmstudio ${res.status}: ${body.slice(0, 300)}`);
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
