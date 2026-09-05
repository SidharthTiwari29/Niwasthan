"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Component, type ReactNode } from "react";

const CinematicLanding = dynamic(
  () =>
    import("@/components/cinematic/NiwasthanCinematicExperience").then(
      (module) => module.NiwasthanCinematicExperience,
    ),
  { ssr: false, loading: () => <HomepageShell /> },
);

function HomepageShell() {
  return (
    <main className="min-h-screen bg-[#0a0c0b] text-[#f4efe6]">
      <header className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-5 py-6 md:px-10 md:py-8">
        <span className="font-display text-2xl">NIWASTHAN</span>
        <Link href="/sign-in" className="rounded-full border border-white/20 bg-black/20 px-5 py-2.5 font-body text-xs font-semibold backdrop-blur-md">Start your home</Link>
      </header>
      <section className="grid min-h-[100svh] place-items-center bg-[radial-gradient(circle_at_center,#272117_0%,#0a0c0b_65%)] px-6 text-center">
        <div><p className="font-mono text-[9px] uppercase tracking-[.3em] text-[#d4af37]">Decide Smart. Live Better.</p><h1 className="mt-5 font-display text-6xl tracking-[-.05em] md:text-9xl">ENTER<br/>YOUR HOME</h1><p className="mx-auto mt-6 max-w-md font-body text-sm text-white/55">Loading the cinematic home journey…</p></div>
      </section>
    </main>
  );
}

class HomepageBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error) { console.error("Niwasthan homepage client rendering failed:", error); }
  render() { return this.state.failed ? <HomepageShell /> : this.props.children; }
}

export default function HomePage() {
  return <HomepageBoundary><CinematicLanding /></HomepageBoundary>;
}
