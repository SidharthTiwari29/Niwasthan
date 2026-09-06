import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth, signOut } from "@/auth";
import { getCurrentPlan } from "@/server/services/currentPlanService";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  const plan = await getCurrentPlan(session.user.id);
  const t = await getTranslations("nav");

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="flex items-center justify-between border-b border-paper-raised px-6 py-4 md:px-10">
        <Link href="/properties" className="font-display text-lg font-semibold">
          {t("brand")}
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/properties"
            className="font-body text-sm text-ink-soft transition-colors hover:text-ink"
          >
            {t("yourHomes")}
          </Link>
          <Link
            href="/catalogue"
            className="font-body text-sm text-ink-soft transition-colors hover:text-ink"
          >
            {t("catalogue")}
          </Link>
          <Link
            href="/pricing"
            className="rounded-full border border-paper-raised px-3 py-1 font-mono text-xs text-ink-soft transition-colors hover:border-laterite hover:text-ink"
          >
            {plan.packageName}
            {plan.packageCode !== "FREE"
              ? ` · ${t("creditsRemaining", { used: plan.creditsRemaining, total: plan.creditsTotal })}`
              : ""}
          </Link>
          <LanguageSwitcher />
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="font-body text-sm text-ink-soft transition-colors hover:text-ink"
            >
              {t("signOut")}
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-10 md:px-10">{children}</main>
    </div>
  );
}
