"use client";

import Image from "next/image";
import Link from "next/link";
import { Component, type ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { CinematicLandingFinal } from "@/components/cinematic/CinematicLandingFinal";

function HomepageShell() {
  const heroImage =
    process.env.NEXT_PUBLIC_NIWASTHAN_HERO_IMAGE || "/hero/01-entrance.webp";

  return (
    <main className="min-h-screen bg-[#171512] text-[#f4efe6]">
      <header className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-5 py-6 md:px-10 md:py-8">
        <span className="font-display text-2xl">Niwasthan</span>
        <Link
          href="/sign-in"
          className="rounded-full border border-white/20 bg-black/20 px-5 py-2.5 font-body text-xs font-semibold backdrop-blur-md"
        >
          Start your home
        </Link>
      </header>

      <section className="relative min-h-[100svh] overflow-hidden">
        <Image
          src={heroImage}
          alt="Niwasthan 4BHK residence"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/15 to-[#171512]" />
        <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-[1440px] items-end px-5 pb-16 md:px-10 md:pb-20">
          <div className="max-w-5xl">
            <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-[#d6b477]">
              A Niwasthan residence
            </p>
            <h1 className="mt-5 font-display text-[clamp(3.7rem,9vw,9rem)] leading-[0.84] tracking-[-0.055em]">
              A better way
              <br />
              to build home.
            </h1>
            <p className="mt-7 max-w-xl font-body text-base leading-relaxed text-white/60">
              See the space. Understand the design. Know the cost. Then decide
              how you want it delivered.
            </p>
            <Link
              href="/sign-in"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#f5efe3] px-6 py-3.5 font-body text-sm font-semibold text-[#151310]"
            >
              Start with your home <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

class HomepageBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    console.error("Niwasthan homepage client rendering failed:", error);
  }

  render() {
    return this.state.failed ? <HomepageShell /> : this.props.children;
  }
}

export default function HomePage() {
  return (
    <HomepageBoundary>
      <CinematicLandingFinal />
    </HomepageBoundary>
  );
}
