import { describe, it, expect } from "vitest";
import { invoiceExtractPrompt } from "../prompts/invoice_extract.js";
import { txnClassifyPrompt } from "../prompts/txn_classify.js";
import { chaseDraftPrompt } from "../prompts/chase_draft.js";

describe("invoice_extract prompt", () => {
  it("declares email_body as required", () => {
    expect(invoiceExtractPrompt.name).toBe("invoice_extract");
    const required = (invoiceExtractPrompt.arguments ?? []).filter(
      (a) => a.required !== false
    );
    expect(required.map((a) => a.name)).toContain("email_body");
  });

  it("renders both system + user messages", () => {
    const out = invoiceExtractPrompt.render({
      email_body: "Invoice for $100 from ACME",
      email_from: "billing@acme.com",
      email_subject: "Invoice #1",
    });
    expect(out.messages).toHaveLength(2);
    const text0 = out.messages[0]!.content.text;
    expect(text0).toContain("vendor.normalized_name");
    expect(text0).toContain("suggested_category");
    const text1 = out.messages[1]!.content.text;
    expect(text1).toContain("billing@acme.com");
    expect(text1).toContain("Invoice for $100 from ACME");
  });

  it("omits optional context lines when not provided", () => {
    const out = invoiceExtractPrompt.render({ email_body: "body text" });
    const userMsg = out.messages[1]!.content.text;
    expect(userMsg).not.toContain("From:");
    expect(userMsg).not.toContain("Subject:");
    expect(userMsg).toContain("body text");
  });

  it("embeds categories_markdown when provided", () => {
    const out = invoiceExtractPrompt.render({
      email_body: "body",
      categories_markdown: "# my categories\n- foo\n- bar",
    });
    const system = out.messages[0]!.content.text;
    expect(system).toContain("# my categories");
    expect(system).toContain("EXACTLY one of these names");
  });

  it("falls back to resource-load instruction without categories_markdown", () => {
    const out = invoiceExtractPrompt.render({ email_body: "body" });
    const system = out.messages[0]!.content.text;
    expect(system).toContain('"bookkeeping://categories"');
    expect(system).toContain('"Uncategorized"');
  });
});

describe("txn_classify prompt", () => {
  it("declares transactions_json as required", () => {
    const required = (txnClassifyPrompt.arguments ?? []).filter(
      (a) => a.required !== false
    );
    expect(required.map((a) => a.name)).toContain("transactions_json");
  });

  it("renders system prompt + transactions payload", () => {
    const out = txnClassifyPrompt.render({
      transactions_json: JSON.stringify([
        { id: "t1", date: "2026-05-01", amount: 20, description: "OPENAI" },
      ]),
    });
    expect(out.messages).toHaveLength(2);
    const system = out.messages[0]!.content.text;
    expect(system).toContain('"classifications"');
    const user = out.messages[1]!.content.text;
    expect(user).toContain("OPENAI");
    expect(user).not.toContain("Known vendor hints");
  });

  it("includes known_vendors hint when provided", () => {
    const out = txnClassifyPrompt.render({
      transactions_json: "[]",
      known_vendors_json: JSON.stringify([
        { name: "OpenAI", default_category: "Software & SaaS" },
      ]),
    });
    const user = out.messages[1]!.content.text;
    expect(user).toContain("Known vendor hints");
    expect(user).toContain("OpenAI");
  });

  it("embeds categories_markdown when provided", () => {
    const out = txnClassifyPrompt.render({
      transactions_json: "[]",
      categories_markdown: "# tax taxonomy\n- one\n- two",
    });
    const system = out.messages[0]!.content.text;
    expect(system).toContain("# tax taxonomy");
    expect(system).toContain("EXACTLY one of these names");
  });
});

describe("chase_draft prompt", () => {
  it("requires client_json and transactions_json", () => {
    const required = (chaseDraftPrompt.arguments ?? []).filter(
      (a) => a.required !== false
    );
    const names = required.map((a) => a.name);
    expect(names).toContain("client_json");
    expect(names).toContain("transactions_json");
  });

  it("defaults tone to friendly", () => {
    const out = chaseDraftPrompt.render({
      client_json: JSON.stringify({ name: "Sarah", email: "s@x.com" }),
      transactions_json: JSON.stringify([
        { id: "t1", date: "2026-05-01", amount: 50, description: "x", missing: "receipt" },
      ]),
    });
    const user = out.messages[1]!.content.text;
    expect(user).toContain("Tone: friendly");
  });

  it("respects firm/neutral tone", () => {
    const firm = chaseDraftPrompt.render({
      client_json: "{}",
      transactions_json: "[]",
      tone: "firm",
    });
    expect(firm.messages[1]!.content.text).toContain("Tone: firm");

    const neutral = chaseDraftPrompt.render({
      client_json: "{}",
      transactions_json: "[]",
      tone: "neutral",
    });
    expect(neutral.messages[1]!.content.text).toContain("Tone: neutral");
  });
});
