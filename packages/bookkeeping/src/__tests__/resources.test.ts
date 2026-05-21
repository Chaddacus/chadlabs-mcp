import { describe, it, expect } from "vitest";
import { categoriesResource, CATEGORIES } from "../resources/categories.js";

describe("categories resource", () => {
  it("uses bookkeeping:// scheme", () => {
    expect(categoriesResource.uri).toBe("bookkeeping://categories");
  });

  it("is markdown", () => {
    expect(categoriesResource.mimeType).toBe("text/markdown");
  });

  it("renders markdown listing each category", async () => {
    const md = await categoriesResource.read();
    expect(md).toContain("# Chart of Accounts");
    expect(md).toContain("Software & SaaS");
    expect(md).toContain("Subcontractors");
    expect(md).toContain("Cloud Hosting");
    expect(md).toContain("Services Revenue");
    expect(md).toContain("Uncategorized");
  });

  it("seed data has both parents and children", () => {
    const parents = CATEGORIES.filter((c) => c.parent === null);
    const children = CATEGORIES.filter((c) => c.parent !== null);
    expect(parents.length).toBeGreaterThan(5);
    expect(children.length).toBeGreaterThan(15);
  });

  it("every child references an existing parent", () => {
    const parentNames = new Set(
      CATEGORIES.filter((c) => c.parent === null).map((c) => c.name)
    );
    for (const c of CATEGORIES.filter((c) => c.parent !== null)) {
      expect(parentNames.has(c.parent!)).toBe(true);
    }
  });
});
