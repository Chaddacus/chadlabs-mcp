import { describe, it, expect, vi } from "vitest";
import { z } from "zod";
import { mockExtractor } from "../extract.js";

const schema = z.object({
  name: z.string(),
  age: z.number(),
});

describe("mockExtractor", () => {
  it("calls fn with input and returns parsed result", async () => {
    const fn = vi.fn((input: string) => ({ name: input, age: 30 }));
    const extractor = mockExtractor({ name: "test", schema, systemPrompt: "extract" }, fn);
    const result = await extractor.extract("Alice");
    expect(fn).toHaveBeenCalledWith("Alice");
    expect(result).toEqual({ name: "Alice", age: 30 });
  });

  it("throws when fn returns data that fails schema validation", async () => {
    const fn = (_input: string) => ({ name: "Alice", age: "not-a-number" } as unknown as { name: string; age: number });
    const extractor = mockExtractor({ name: "test", schema, systemPrompt: "extract" }, fn);
    await expect(extractor.extract("Alice")).rejects.toThrow(/test.*schema validation failed/i);
  });

  it("includes field path in error message", async () => {
    const fn = (_input: string) => ({ name: 42, age: "bad" } as unknown as { name: string; age: number });
    const extractor = mockExtractor({ name: "test", schema, systemPrompt: "extract" }, fn);
    await expect(extractor.extract("input")).rejects.toThrow("name");
  });
});
