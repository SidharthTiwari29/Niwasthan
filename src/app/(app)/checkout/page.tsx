import { CheckoutClient } from "./CheckoutClient";

const REAL_PACKAGES: Record<string, { name: string; price: string }> = {
  NIWASTHAN_STARTER: { name: "Niwasthan Starter", price: "₹199" },
  NIWASTHAN_DESIGN: { name: "Niwasthan Design", price: "₹999" },
  NIWASTHAN_HOME_BOOK: { name: "Niwasthan Home Book", price: "₹2,599" },
  NIWASTHAN_IMMERSIVE: { name: "Niwasthan Immersive", price: "₹9,999" },
};

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ package?: string }>;
}) {
  const { package: packageCode } = await searchParams;
  const plan = packageCode ? REAL_PACKAGES[packageCode] : undefined;

  return (
    <div className="mx-auto max-w-md">
      <h1 className="font-display text-3xl font-semibold">Checkout</h1>
      {plan ? (
        <p className="mt-2 font-body text-sm text-ink-soft">
          {plan.name} — {plan.price}
        </p>
      ) : (
        <p className="mt-2 font-body text-sm text-alert">
          We couldn&apos;t find that plan. Please go back to pricing and choose
          again.
        </p>
      )}
      {plan && packageCode ? (
        <CheckoutClient packageCode={packageCode} />
      ) : null}
    </div>
  );
}
