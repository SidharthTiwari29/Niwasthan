import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth, signOut } from "@/auth";
import { getCurrentPlan } from "@/server/services/currentPlanService";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { NotificationBell } from "@/components/NotificationBell";

const workspaceNav = [
  { href: "/properties", label: "Command center", icon: "⌂" },
  { href: "/properties", label: "My homes", icon: "⌂" },
  { href: "/catalogue", label: "Catalogue intelligence", icon: "◇" },
  { href: "/properties", label: "Budget & BOQ", icon: "₹" },
  { href: "/properties", label: "Build & handover", icon: "◫" },
];

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");
  const plan = await getCurrentPlan(session.user.id);
  const t = await getTranslations("nav");

  return (
    <div className="authenticated-shell min-h-screen bg-paper text-ink">
      <div className="flex min-h-screen">
        <aside className="hidden w-[252px] shrink-0 flex-col border-r border-ink/10 bg-[#f7f3e9] px-5 py-7 lg:flex">
          <Link href="/properties" className="mb-12 flex items-center gap-3 px-2">
            <span className="grid h-9 w-9 place-items-center rounded-[13px] bg-ink text-brass">✦</span>
            <span>
              <span className="block font-display text-[22px] font-semibold leading-none tracking-[-0.05em]">niwasthan</span>
              <span className="mt-1 block font-mono text-[8px] font-medium uppercase tracking-[0.25em] text-ink-soft">home intelligence</span>
            </span>
          </Link>
          <p className="mb-3 px-3 font-mono text-[9px] font-semibold uppercase tracking-[0.25em] text-ink-soft">Workspace</p>
          <nav className="space-y-1">
            {workspaceNav.map((item, index) => (
              <Link key={`${item.label}-${index}`} href={item.href} className={`group flex items-center gap-3 rounded-xl px-3 py-3 font-body text-sm transition-colors ${index === 0 ? "bg-paper-raised font-semibold text-ink" : "text-ink-soft hover:bg-paper-raised/70 hover:text-ink"}`}>
                <span className="grid h-5 w-5 place-items-center text-base">{item.icon}</span>
                <span>{item.label}</span>
                {index === 0 ? <span className="ml-auto text-ink-soft">›</span> : null}
              </Link>
            ))}
          </nav>
          <div className="mt-auto rounded-2xl bg-ink p-4 text-paper">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-brass">Humsafar</p>
            <p className="mt-3 font-display text-xl leading-tight">A better home starts with a better decision.</p>
            <Link href="/properties" className="mt-4 inline-flex text-xs font-semibold text-brass">Open your workspace ↗</Link>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-ink/10 bg-paper/90 px-5 backdrop-blur-md md:px-10">
            <Link href="/properties" className="font-display text-xl font-semibold tracking-[-0.05em] lg:hidden">niwasthan</Link>
            <div className="hidden items-center gap-2 text-xs text-ink-soft sm:flex"><span className="h-2 w-2 rounded-full bg-moss" /> Workspace synced</div>
            <div className="ml-auto flex items-center gap-3">
              <Link href="/pricing" className="hidden rounded-full border border-ink/15 px-3 py-2 font-mono text-[10px] text-ink-soft transition-colors hover:border-laterite sm:block">{plan.packageName}{plan.packageCode !== "FREE" ? ` · ${t("creditsRemaining", { used: plan.creditsRemaining, total: plan.creditsTotal })}` : ""}</Link>
              <LanguageSwitcher />
              <NotificationBell />
              <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}><button type="submit" className="hidden font-body text-xs text-ink-soft transition-colors hover:text-ink sm:block">{t("signOut")}</button></form>
            </div>
          </header>
          <main className="mx-auto max-w-[1440px] px-5 py-8 md:px-10 md:py-10">{children}</main>
        </div>
      </div>
    </div>
  );
}
