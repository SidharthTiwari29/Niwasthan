// README §29 (Niwasthan Personality) + §30 (Niwasthan Moments): the exact
// brand voice specified in the vision document, not generic notification
// copy. "Warm, slightly quirky, useful and brandable... never childish,
// spammy or distracting." Humour is deliberately confined to a single
// personality line per moment - the underlying data (price, saving
// amount, status) is always stated plainly alongside it, never replaced
// by the joke, per §29's explicit rule that humour "must never obscure
// financial, safety, legal or execution information."
export type MomentType =
  | "PRICE_DROP"
  | "BETTER_ALTERNATIVE_FOUND"
  | "BUDGET_EXCEEDED"
  | "DESIGN_APPROVED"
  | "WALKTHROUGH_READY"
  | "PURCHASE_CONFIRMED";

export type MomentContext = {
  itemName?: string;
  savingMinor?: bigint;
  overageMinor?: bigint;
  packageName?: string;
  amountMinor?: bigint;
};

export type Moment = {
  title: string;
  message: string;
};

function formatRupees(minor: bigint): string {
  const rupees = minor / 100n;
  return `₹${rupees.toLocaleString("en-IN")}`;
}

// One curated line per moment type, taken directly from the README's own
// examples - not invented copy. Where the README's example is generic
// ("that light you liked"), the real item name is substituted in when
// available, falling back to the README's own generic phrasing when it
// isn't (e.g. a price-drop notification triggered by an automated feed
// scan that doesn't have a friendly display name yet).
export function buildMoment(
  type: MomentType,
  context: MomentContext = {},
): Moment {
  switch (type) {
    case "PRICE_DROP":
      return {
        title: "🔥 Price drop",
        message: context.itemName
          ? `Remember ${context.itemName}? It just got cheaper. We noticed.`
          : "Remember that item you liked? It just got cheaper. We noticed.",
      };
    case "BETTER_ALTERNATIVE_FOUND":
      return {
        title: "🕵️ We found a lookalike",
        message:
          context.savingMinor !== undefined
            ? `Same vibe. ${formatRupees(context.savingMinor)} less damage to the wallet.`
            : "Same vibe. Less damage to the wallet.",
      };
    case "BUDGET_EXCEEDED":
      return {
        title: "😅 Budget line crossed",
        message:
          context.overageMinor !== undefined
            ? `We have crossed the budget line by ${formatRupees(context.overageMinor)}. Should we retreat gracefully?`
            : "We have crossed the budget line. Should we retreat gracefully?",
      };
    case "DESIGN_APPROVED":
      return {
        title: "🎉 Locked in",
        message: "Locked. No more changing the sofa every 14 minutes.",
      };
    case "WALKTHROUGH_READY":
      return {
        title: "🚪 Walkthrough ready",
        message: "Your future home is ready. Shall we go inside?",
      };
    case "PURCHASE_CONFIRMED":
      return {
        title: "✅ Payment received",
        message:
          context.packageName && context.amountMinor !== undefined
            ? `${context.packageName} is active - ${formatRupees(context.amountMinor)} received. Let's get to work.`
            : "Your payment went through. Let's get to work.",
      };
  }
}

// README §33 Niwasthan Finds: "the proactive discovery layer." Built
// honestly against what real data actually exists on CatalogueItem today
// (name, price) - deliberately omits style-match %, availability region,
// and warranty from the README's own illustrative example, since none of
// those are real, evidenced fields in this schema yet. Per §33's own
// explicit rule ("No fabricated price, availability or product evidence
// is acceptable"), showing a fabricated 92% style match would violate
// the very principle this feature is named after. Extend this function
// with those fields only once real evidence for them exists.
export type NiwasthanFind = {
  title: string;
  selectedItemName: string;
  selectedPriceMinor: bigint;
  alternativeName: string;
  alternativePriceMinor: bigint;
  savingMinor: bigint;
};

export function buildNiwasthanFind(input: {
  selectedItemName: string;
  selectedPriceMinor: bigint;
  alternativeName: string;
  alternativePriceMinor: bigint;
}): NiwasthanFind | null {
  const savingMinor = input.selectedPriceMinor - input.alternativePriceMinor;
  // Not a "find" if the alternative isn't actually cheaper - this function
  // only ever returns a genuine deal, never a lateral or worse option
  // dressed up as a discovery.
  if (savingMinor <= 0n) return null;

  return {
    title: "Niwasthan Found a Better Deal",
    selectedItemName: input.selectedItemName,
    selectedPriceMinor: input.selectedPriceMinor,
    alternativeName: input.alternativeName,
    alternativePriceMinor: input.alternativePriceMinor,
    savingMinor,
  };
}
