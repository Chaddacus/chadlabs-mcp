import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mockExtractor } from "@chadlabs/core";
import {
  ChaseDraftInputSchema,
  ChaseDraftOutputSchema,
  _setExtractor,
  _resetExtractor,
  chaseDraftTool,
  type ChaseDraftOutput,
} from "../tools/chase_draft.js";
import { chaseScenarios } from "../__fixtures__/chase_scenarios.js";

function unwrap<T>(envelope: { content: Array<{ type: string; text: string }> }): T {
  const text = envelope.content[0]?.text ?? "";
  return JSON.parse(text) as T;
}

describe("chase_draft tool", () => {
  beforeEach(() => {
    _setExtractor(
      mockExtractor(
        { name: "chase_draft", schema: ChaseDraftOutputSchema, systemPrompt: "" },
        (input: string) => {
          const txnMatch = input.match(/Transactions: (\[.*\])/s);
          let txnIds: string[] = [];
          if (txnMatch?.[1]) {
            try {
              const txns = JSON.parse(txnMatch[1]) as Array<{ id: string }>;
              txnIds = txns.map((t) => t.id);
            } catch {
              // fall through
            }
          }
          const tone = (input.match(/Tone: (\w+)/)?.[1] ?? "friendly") as
            | "friendly"
            | "firm"
            | "neutral";

          const intro =
            tone === "firm"
              ? "Please send the following items by end of week."
              : tone === "neutral"
              ? "Below are items needing follow-up."
              : "Hope you're well — when you have a moment, could you help me with these?";

          const lines = txnIds.map((id) => `- ${id}`).join("\n");

          return {
            subject: `Quick request: ${txnIds.length} transactions need a follow-up`,
            body_markdown: `${intro}\n\n${lines}\n\nThanks!\nYour Bookkeeper`,
            body_plain: `${intro}\n\n${lines.replace(/^- /gm, "")}\n\nThanks!\nYour Bookkeeper`,
            transaction_ids: txnIds,
          };
        }
      )
    );
  });

  afterEach(() => {
    _resetExtractor();
  });

  it("tool is named chase_draft", () => {
    expect(chaseDraftTool.name).toBe("chase_draft");
  });

  it("tool has a description", () => {
    expect(chaseDraftTool.description.length).toBeGreaterThan(10);
  });

  it("inputSchema rejects empty transactions array", () => {
    const result = ChaseDraftInputSchema.safeParse({
      client: { name: "X", email: "x@y.com" },
      transactions: [],
    });
    expect(result.success).toBe(false);
  });

  it.each(chaseScenarios)(
    "scenario $id produces well-formed output",
    async (scenario) => {
      const envelope = await chaseDraftTool.handler(scenario.input);
      const data = ChaseDraftOutputSchema.parse(unwrap<ChaseDraftOutput>(envelope));

      expect(data.subject.length).toBeGreaterThan(0);
      expect(data.body_markdown.length).toBeGreaterThan(0);
      expect(data.body_plain.length).toBeGreaterThan(0);
      expect(data.transaction_ids).toEqual(
        scenario.input.transactions.map((t) => t.id)
      );
    }
  );

  it("all 3 scenarios return valid output", async () => {
    const results = await Promise.all(
      chaseScenarios.map((s) => chaseDraftTool.handler(s.input))
    );
    expect(results).toHaveLength(3);
    for (const r of results) {
      const data = unwrap<ChaseDraftOutput>(r);
      const parsed = ChaseDraftOutputSchema.safeParse(data);
      expect(parsed.success).toBe(true);
    }
  });
});
