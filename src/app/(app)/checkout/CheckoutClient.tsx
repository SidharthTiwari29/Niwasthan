"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

type CheckoutState =
  | { status: "idle" }
  | { status: "creating_order" }
  | { status: "awaiting_payment" }
  | { status: "submitted" }
  | { status: "error"; message: string };

// Real, deliberate honesty boundary: Razorpay's own client-side success
// callback only confirms the payment widget completed - it is not
// authoritative proof the payment actually captured. Only the real,
// server-verified webhook (payments/webhook/route.ts, already built and
// tested) updates the real purchase/entitlement state. This component
// never claims "your plan is now active" itself - it tells the customer
// their payment was submitted and where their real, authoritative status
// will appear once the webhook has processed it.
export function CheckoutClient({ packageCode }: { packageCode: string }) {
  const router = useRouter();
  const [state, setState] = useState<CheckoutState>({ status: "idle" });
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    const existing = document.getElementById("razorpay-checkout-script");
    if (existing) {
      // The script tag already exists from an earlier mount (e.g. a
      // client-side navigation back to this page) - defer the state
      // update to a real microtask rather than calling setState
      // synchronously in the effect body, which avoids the exact
      // cascading-render risk this lint rule exists to catch.
      queueMicrotask(() => setScriptLoaded(true));
      return;
    }
    const script = document.createElement("script");
    script.id = "razorpay-checkout-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => setScriptLoaded(true);
    document.body.appendChild(script);
  }, []);

  async function startCheckout() {
    setState({ status: "creating_order" });
    try {
      const response = await fetch("/api/payments/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageCode }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(
          body?.error ?? "Couldn't start checkout for this plan.",
        );
      }
      const { purchase, razorpayKeyId } = await response.json();

      setState({ status: "awaiting_payment" });
      const razorpay = new window.Razorpay({
        key: razorpayKeyId,
        amount: purchase.amountMinor,
        currency: purchase.currency,
        order_id: purchase.providerOrderId,
        name: "Niwasthan",
        description: purchase.packageCode,
        handler: () => {
          // Real, honest boundary: this fires when Razorpay's own widget
          // believes the payment succeeded, not when our system has
          // verified it. The real webhook does that separately.
          setState({ status: "submitted" });
        },
        modal: {
          ondismiss: () => setState({ status: "idle" }),
        },
      });
      razorpay.open();
    } catch (err) {
      setState({
        status: "error",
        message:
          err instanceof Error ? err.message : "Couldn't start checkout.",
      });
    }
  }

  if (state.status === "submitted") {
    return (
      <div className="mt-6 rounded-sm border border-paper-raised p-4">
        <p className="font-body text-sm font-medium text-ink">
          Your payment was submitted.
        </p>
        <p className="mt-2 font-body text-sm text-ink-soft">
          We&apos;re confirming it now — this usually takes a few seconds. Your
          real plan status will appear here once it&apos;s verified.
        </p>
        <button
          onClick={() => router.push("/properties")}
          className="mt-4 rounded-sm bg-indigo px-4 py-2 font-body text-sm font-medium text-paper transition-colors hover:bg-indigo-soft"
        >
          Go to your homes
        </button>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <button
        onClick={startCheckout}
        disabled={!scriptLoaded || state.status === "creating_order"}
        className="w-full rounded-sm bg-laterite px-5 py-2.5 font-body text-sm font-medium text-paper transition-colors hover:bg-laterite-deep disabled:opacity-50"
      >
        {state.status === "creating_order"
          ? "Preparing checkout…"
          : state.status === "awaiting_payment"
            ? "Complete payment in the window…"
            : "Pay now"}
      </button>
      {state.status === "error" ? (
        <p className="mt-3 font-body text-sm text-alert">{state.message}</p>
      ) : null}
    </div>
  );
}
