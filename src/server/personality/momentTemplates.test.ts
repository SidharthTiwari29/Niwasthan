import { describe, expect, it } from "vitest";
import { buildMoment, buildNiwasthanFind } from "./momentTemplates";

describe("buildMoment", () => {
  it("builds a PRICE_DROP moment with the item name when available", () => {
    const moment = buildMoment("PRICE_DROP", {
      itemName: "that pendant light",
    });
    expect(moment.message).toContain("that pendant light");
    expect(moment.title).toContain("🔥");
  });

  it("falls back to generic phrasing for PRICE_DROP without an item name", () => {
    const moment = buildMoment("PRICE_DROP");
    expect(moment.message).toContain("that item you liked");
  });

  it("includes the exact saving amount, formatted in Indian rupee grouping, for BETTER_ALTERNATIVE_FOUND", () => {
    const moment = buildMoment("BETTER_ALTERNATIVE_FOUND", {
      savingMinor: 290100n, // ₹2,901 - the exact README example figure
    });
    expect(moment.message).toContain("₹2,901");
  });

  it("includes the exact overage amount for BUDGET_EXCEEDED", () => {
    const moment = buildMoment("BUDGET_EXCEEDED", { overageMinor: 800000n });
    expect(moment.message).toContain("₹8,000");
  });

  it("never fabricates a number when context data is not provided", () => {
    const moment = buildMoment("BUDGET_EXCEEDED");
    expect(moment.message).not.toMatch(/₹/);
    expect(moment.message).toContain("crossed the budget line");
  });

  it("returns the exact README example copy for DESIGN_APPROVED", () => {
    const moment = buildMoment("DESIGN_APPROVED");
    expect(moment.message).toBe(
      "Locked. No more changing the sofa every 14 minutes.",
    );
  });

  it("returns the exact README example copy for WALKTHROUGH_READY", () => {
    const moment = buildMoment("WALKTHROUGH_READY");
    expect(moment.message).toBe(
      "Your future home is ready. Shall we go inside?",
    );
  });

  it("includes the real package name and amount, formatted in Indian rupee grouping, for PURCHASE_CONFIRMED", () => {
    const moment = buildMoment("PURCHASE_CONFIRMED", {
      packageName: "Niwasthan Design",
      amountMinor: 99900n, // hand-verified: 99900 paise = ₹999
    });
    expect(moment.message).toContain("Niwasthan Design");
    expect(moment.message).toContain("₹999");
  });

  it("falls back to generic phrasing for PURCHASE_CONFIRMED without real package/amount context", () => {
    const moment = buildMoment("PURCHASE_CONFIRMED");
    expect(moment.message).toBe(
      "Your payment went through. Let's get to work.",
    );
  });

  it("never lets personality copy exceed a reasonable length that could bury real information", () => {
    // README §29: humour must never obscure financial/safety/execution
    // information - a sanity bound to catch someone accidentally writing
    // an essay into a notification message later.
    for (const type of [
      "PRICE_DROP",
      "BETTER_ALTERNATIVE_FOUND",
      "BUDGET_EXCEEDED",
      "DESIGN_APPROVED",
      "WALKTHROUGH_READY",
      "PURCHASE_CONFIRMED",
    ] as const) {
      const moment = buildMoment(type, {
        itemName: "a very specific item name",
        savingMinor: 100000n,
        overageMinor: 100000n,
        packageName: "Niwasthan Design",
        amountMinor: 100000n,
      });
      expect(moment.message.length).toBeLessThan(200);
    }
  });
});

describe("buildNiwasthanFind", () => {
  it("computes the exact saving between the selected item and the cheaper alternative", () => {
    // README's own example: ₹8,900 selected, ₹5,999 alternative, ₹2,901 saving.
    const find = buildNiwasthanFind({
      selectedItemName: "Pendant Light",
      selectedPriceMinor: 890000n,
      alternativeName: "Similar verified option",
      alternativePriceMinor: 599900n,
    });
    expect(find).not.toBeNull();
    expect(find?.savingMinor).toBe(290100n);
  });

  it("returns null when the alternative is not actually cheaper (never surfaces a fake deal)", () => {
    const find = buildNiwasthanFind({
      selectedItemName: "Item A",
      selectedPriceMinor: 100000n,
      alternativeName: "Item B",
      alternativePriceMinor: 100000n,
    });
    expect(find).toBeNull();
  });

  it("returns null when the alternative is more expensive", () => {
    const find = buildNiwasthanFind({
      selectedItemName: "Item A",
      selectedPriceMinor: 100000n,
      alternativeName: "Item B",
      alternativePriceMinor: 150000n,
    });
    expect(find).toBeNull();
  });

  it("never includes fabricated fields (style match, availability, warranty) not backed by real data", () => {
    const find = buildNiwasthanFind({
      selectedItemName: "Item A",
      selectedPriceMinor: 100000n,
      alternativeName: "Item B",
      alternativePriceMinor: 80000n,
    });
    expect(find).not.toHaveProperty("styleMatch");
    expect(find).not.toHaveProperty("availability");
    expect(find).not.toHaveProperty("warranty");
  });
});
