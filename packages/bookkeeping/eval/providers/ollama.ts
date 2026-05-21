import type { LLMProvider, ProviderRequest, ProviderResponse } from "../types.js";

function endpoint(): string {
  return process.env["OLLAMA_HOST"] ?? "http://127.0.0.1:11434";
}

export const ollamaProvider: LLMProvider = {
  id: "ollama",
  name: "Ollama (local)",
  available(): boolean {
    // Available if env says so OR `--provider=ollama` is explicit (called via complete()).
    // For the harness we treat OLLAMA_AVAILABLE=1 or OLLAMA_HOST set as the signal.
    return !!(process.env["OLLAMA_AVAILABLE"] || process.env["OLLAMA_HOST"]);
  },
  defaultModel(): string {
    return process.env["OLLAMA_MODEL"] ?? "llama3.3";
  },
  async complete(req: ProviderRequest): Promise<ProviderResponse> {
    const start = Date.now();
    const res = await fetch(`${endpoint()}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        model: req.model,
        format: "json",
        stream: false,
        messages: [
          { role: "system", content: req.systemText },
          { role: "user", content: req.userText },
        ],
        options: { temperature: 0 },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`ollama ${res.status}: ${body.slice(0, 300)}`);
    }

    const data = (await res.json()) as {
      message?: { content?: string };
      prompt_eval_count?: number;
      eval_count?: number;
    };
    const rawText = data.message?.content ?? "";

    return {
      rawText,
      inputTokens: data.prompt_eval_count ?? null,
      outputTokens: data.eval_count ?? null,
      latencyMs: Date.now() - start,
    };
  },
};
