"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./NiwasthanCinematicExperience.module.css";

type Scene = { id: string; label: string; image: string };
type Hotspot = { id: string; scene: number; x: number; y: number; title: string; brand: string; spec: string; warranty: string; unitPrice: number };

const scenes: Scene[] = [
  { id: "living", label: "Living Room", image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=3840&q=90" },
  { id: "kitchen-dining", label: "Dining • Kitchen", image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=3840&q=90" },
  { id: "master", label: "Master", image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=3840&q=90" },
  { id: "kids", label: "Kids", image: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=3840&q=90" },
  { id: "balcony", label: "Balcony", image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=3840&q=90" },
];

// Presentation data only: catalogue verification remains the source of truth for live commercial values.
const hotspots: Hotspot[] = [
  { id: "marble", scene: 0, x: 31, y: 76, title: "Italian Marble Flooring", brand: "Catalogue-selected brand", spec: "Large-format premium natural stone finish", warranty: "Catalogue verified", unitPrice: 0 },
  { id: "fluted", scene: 0, x: 68, y: 41, title: "Fluted Wall Panels", brand: "Catalogue-selected brand", spec: "Architectural fluted panel system", warranty: "Catalogue verified", unitPrice: 0 },
  { id: "lighting", scene: 0, x: 81, y: 26, title: "Smart Lighting", brand: "Catalogue-selected brand", spec: "Ambient + accent + task lighting", warranty: "Catalogue verified", unitPrice: 0 },
  { id: "quartz", scene: 1, x: 56, y: 58, title: "Quartz Countertop", brand: "Catalogue-selected brand", spec: "Engineered quartz work surface", warranty: "Catalogue verified", unitPrice: 0 },
  { id: "acrylic", scene: 1, x: 77, y: 37, title: "Acrylic Cabinets", brand: "Catalogue-selected brand", spec: "Premium acrylic cabinet finish", warranty: "Catalogue verified", unitPrice: 0 },
  { id: "appliances", scene: 1, x: 38, y: 48, title: "Built-in Appliances", brand: "Catalogue-selected brand", spec: "Integrated appliance package", warranty: "Catalogue verified", unitPrice: 0 },
  { id: "wardrobe", scene: 2, x: 76, y: 46, title: "Premium Hardwood Wardrobe", brand: "Catalogue-selected brand", spec: "Full-height premium wardrobe system", warranty: "Catalogue verified", unitPrice: 0 },
  { id: "glazing", scene: 2, x: 23, y: 32, title: "Soundproof Glazing", brand: "Catalogue-selected brand", spec: "Acoustic-performance glazing", warranty: "Catalogue verified", unitPrice: 0 },
  { id: "study", scene: 3, x: 66, y: 57, title: "Kids Storage & Study", brand: "Catalogue-selected brand", spec: "Integrated desk + storage system", warranty: "Catalogue verified", unitPrice: 0 },
  { id: "green", scene: 4, x: 63, y: 48, title: "Balcony Greenery", brand: "Catalogue-selected brand", spec: "Low-maintenance outdoor planting system", warranty: "Catalogue verified", unitPrice: 0 },
];

const roomTotals = ["Living", "Kitchen", "Master", "Kids", "Balcony"].map((room) => ({ room, value: 0 }));
const clamp = (n: number, min = 0, max = 1) => Math.min(max, Math.max(min, n));
const fmt = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

export function NiwasthanCinematicExperience() {
  const ref = useRef<HTMLElement>(null);
  const [smooth, setSmooth] = useState(0);
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const reduced = useMemo(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let target = 0;
    let current = 0;
    let raf = 0;
    const read = () => {
      const max = Math.max(1, el.offsetHeight - window.innerHeight);
      target = clamp((window.scrollY - el.offsetTop) / max);
      if (reduced) { current = target; setSmooth(target); }
    };
    const tick = () => {
      if (!reduced) current += (target - current) * 0.12;
      setSmooth(current);
      raf = requestAnimationFrame(tick);
    };
    read();
    window.addEventListener("scroll", read, { passive: true });
    window.addEventListener("resize", read);
    raf = requestAnimationFrame(tick);
    return () => { window.removeEventListener("scroll", read); window.removeEventListener("resize", read); cancelAnimationFrame(raf); };
  }, [reduced]);

  useEffect(() => {
    const onMove = (event: MouseEvent) => {
      document.documentElement.style.setProperty("--mx", `${(event.clientX / window.innerWidth - 0.5) * 2}`);
      document.documentElement.style.setProperty("--my", `${(event.clientY / window.innerHeight - 0.5) * 2}`);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  const p = smooth * 6500;
  const enter = clamp(p / 800);
  const discover = clamp((p - 800) / 1700);
  const understand = clamp((p - 2500) / 1300);
  const price = clamp((p - 3800) / 1000);
  const design = clamp((p - 4800) / 800);
  const build = clamp((p - 5600) / 900);
  const activeScene = p < 800 ? -1 : Math.min(4, Math.floor((p - 800) / 340));
  const selected = hotspots.find((h) => h.id === activeHotspot);
  const total = roomTotals.reduce((s, r) => s + r.value, 0);
  const jump = (px: number) => {
    const node = ref.current;
    if (!node) return;
    window.scrollTo({ top: node.offsetTop + px, behavior: reduced ? "auto" : "smooth" });
    setMenuOpen(false);
  };

  return (
    <main ref={ref} className={styles.shell}>
      <section className={styles.cinemaScroll} id="cinema" aria-label="Niwasthan Home Tour">
        <div className={styles.stage}>
          <div className={styles.world}>
            <header className={styles.header} aria-label="Primary Navigation">
              <button className={styles.logo} onClick={() => jump(0)}>NIWASTHAN</button>
              <nav className={`${styles.nav} ${menuOpen ? styles.navOpen : ""}`} aria-label="Main Menu">
                {[0, 800, 2500, 3800, 4800, 5600].map((at, i) => <button key={at} onClick={() => jump(at)}>{`0${i + 1} ${["Enter", "Discover", "Understand", "Price", "Design", "Build"][i]}`}</button>)}
              </nav>
              <button className={styles.boqPill} onClick={() => jump(3800)} aria-label="View Running Total"><span>Total Estimate:</span><strong>{fmt(total)}</strong></button>
              <button className={styles.menuButton} onClick={() => setMenuOpen((v) => !v)} aria-label="Menu">☰</button>
            </header>

            <div className={styles.backStack}>
              <div className={styles.sceneLayer + " " + styles.layerEntrance} style={{ opacity: 1 - enter * 0.75, transform: `scale(${1 + enter * 0.85})` }}>
                <div className={styles.corridorWall} />
                <div className={styles.singleDoor} />
                <div className={styles.doorHardware} />
                <div className={styles.nameplate}>NIWASTHAN</div>
              </div>
              {scenes.map((scene, i) => {
                const fadeIn = clamp((p - (800 + i * 300)) / 300);
                const fadeOut = clamp((2500 - p) / 300);
                const opacity = discover * (i === activeScene ? 1 : 0.04) * (i === 4 ? 1 : fadeOut + fadeIn);
                const zoom = 1 + clamp((p - (800 + i * 300)) / 1000) * (0.2 + i * 0.012);
                return <div key={scene.id} className={`${styles.sceneLayer} ${styles[`layer${i}`]}`} style={{ opacity, transform: `scale(${zoom}) translate3d(calc(var(--mx) * ${-1.4 - i * 0.45}px), calc(var(--my) * ${-0.8 - i * 0.25}px), 0)` }}><img src={scene.image} alt="" /><div className={styles.sceneVeil} /></div>;
              })}
            </div>
            <div className={styles.shade} />

            <section className={`${styles.storyPanel} ${styles.panelEnter}`} style={{ opacity: 1 - enter }}><span className={styles.eyebrow}>01 · NIWASTHAN</span><h1>ENTER YOUR HOME</h1><p>Decide Smart. Live Better.</p><span className={styles.scrollCue}>Scroll to enter ↓</span></section>
            <section className={`${styles.storyPanel} ${styles.panelDiscover}`} style={{ opacity: discover * (1 - understand) }}><span className={styles.eyebrow}>02 · DISCOVER</span><h2>DISCOVER YOUR HOME</h2><div className={styles.roomIndicator}>Living Room • Dining • Kitchen • Master • Kids • Balcony</div></section>

            <section className={styles.hotspotContainer} style={{ opacity: understand }} aria-label="Material Intelligence">
              {hotspots.map((h) => <button key={h.id} className={`${styles.hotspot} ${h.scene === activeScene ? styles.hotspotActive : ""}`} style={{ left: `${h.x}%`, top: `${h.y}%`, transform: `translate(-50%,-50%) scale(${h.scene === activeScene ? 1 : 0.35})` }} onClick={() => setActiveHotspot(selected?.id === h.id ? null : h.id)} aria-label={`Inspect ${h.title}`}><span>+</span></button>)}
              {selected && <aside className={styles.materialCard}><button onClick={() => setActiveHotspot(null)} className={styles.close}>×</button><span className={styles.eyebrow}>MATERIAL INTELLIGENCE</span><h3>{selected.title}</h3><dl><dt>Brand</dt><dd>{selected.brand}</dd><dt>Specification</dt><dd>{selected.spec}</dd><dt>Warranty</dt><dd>{selected.warranty}</dd><dt>Unit Price</dt><dd>{selected.unitPrice ? fmt(selected.unitPrice) : "Catalogue verified"}</dd></dl></aside>}
            </section>

            <section className={styles.storyPanel + " " + styles.panelUnderstand} style={{ opacity: understand * (1 - price) }}><span className={styles.eyebrow}>03 · UNDERSTAND</span><h2>UNDERSTAND YOUR HOME</h2><p>Tap the gold points to inspect materials, brands, specifications, warranty and price intelligence.</p></section>

            <section className={styles.boqBreakdownCard} style={{ opacity: price, transform: `translateY(${50 - price * 50}px)` }}><div><span className={styles.eyebrow}>04 · PRICE YOUR HOME</span><h2>PRICE YOUR HOME</h2></div><div className={styles.boqCard}><header><span>RUNNING TOTAL</span><strong>{fmt(total)}</strong></header>{roomTotals.map((r) => <div className={styles.boqRow} key={r.room}><span>{r.room}</span><b>{fmt(r.value)}</b></div>)}<footer>Room-level BOQ • Product-level transparency</footer></div></section>

            <section className={styles.designPanel} style={{ opacity: design, transform: `translateY(${40 - design * 40}px)` }}><span className={styles.eyebrow}>05 · DESIGN YOUR HOME</span><h2>DESIGN YOUR HOME</h2><div className={styles.processGrid}><article><b>01</b><h3>Niwasthan Process</h3><p>Discovery → Design → Visualization → Handover</p></article><article><b>02</b><h3>AI + Design Intelligence</h3><p>Spatial optimization and material intelligence.</p></article><article><b>03</b><h3>Real-Time 3D Visualization</h3><p>Experience the home before you build it.</p></article></div></section>

            <section className={styles.buildPanel} style={{ opacity: build, transform: `translateY(${40 - build * 40}px)` }}><span className={styles.eyebrow}>06 · BUILD YOUR HOME</span><h2>BUILD YOUR HOME</h2><div className={styles.buildSteps}>{["Procurement", "Execution", "Quality Control", "Handover"].map((s, i) => <div key={s}><b>{`0${i + 1}`}</b><span>{s}</span>{i < 3 && <i>→</i>}</div>)}</div></section>
          </div>
        </div>
      </section>
      <footer className={styles.footer}><div className={styles.footerContent}><div className={styles.footerBrand}>NIWASTHAN</div><div className={styles.footerLinks}><button>Contact</button><button>Terms & Conditions</button><button>Privacy</button><button>Refund</button><button>Social</button></div><div className={styles.copyright}>© 2026 Niwasthan. All rights reserved.</div></div></footer>
    </main>
  );
}
