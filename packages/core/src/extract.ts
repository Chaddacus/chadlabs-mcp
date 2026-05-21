import Anthropic from "@anthropic-ai/sdk";
import { ZodSchema, ZodError } from "zod";

const MODEL = "claude-sonnet-4-5-20250929";

export interface Extractor<T> {
  extract(input: string): Promise<T>;
}

export function defineExtractor<T>(opts: {
  name: string;
  schema: ZodSchema<T>;
  systemPrompt: string;
}): Extractor<T> {
  const client = new Anthropic();

  return {
    async extract(input: string): Promise<T> {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 4096,
        system: opts.systemPrompt + "\n\nRespond with valid JSON only. No prose.",
        messages: [{ role: "user", content: input }],
      });

      const block = response.content[0];
      if (!block || block.type !== "text") {
        throw new Error(`[${opts.name}] Unexpected response type from API`);
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(block.text);
      } catch {
        throw new Error(`[${opts.name}] API response was not valid JSON: ${block.text.slice(0, 200)}`);
      }

      try {
        return opts.schema.parse(parsed);
      } catch (err) {
        if (err instanceof ZodError) {
          const paths = err.issues.map((i) => i.path.join(".")).join(", ");
          throw new Error(`[${opts.name}] Schema validation failed at: ${paths}`);
        }
        throw err;
      }
    },
  };
}

export function mockExtractor<T>(
  opts: { name: string; schema: ZodSchema<T>; systemPrompt: string },
  fn: (input: string) => T
): Extractor<T> {
  return {
    async extract(input: string): Promise<T> {
      const raw = fn(input);
      try {
        return opts.schema.parse(raw);
      } catch (err) {
        if (err instanceof ZodError) {
          const paths = err.issues.map((i) => i.path.join(".")).join(", ");
          throw new Error(`[${opts.name}] Mock schema validation failed at: ${paths}`);
        }
        throw err;
      }
    },
  };
}
