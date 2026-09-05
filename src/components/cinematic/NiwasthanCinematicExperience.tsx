"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowRight, Check, ChevronDown, X } from "lucide-react";
import styles from "./NiwasthanCinematicExperience.module.css";

const scenes = [
  { id: "living", label: "Living", image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=3840&q=90" },
  { id: "kitchen", label: "Kitchen", image: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=3840&q=90" },
  { id: "master", label: "Master", image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=3840&q=90" },
  { id: "kids", label: "Kids", image: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=3840&q=90" },
  { id: "balcony", label: "Balcony", image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=3840&q=90" },
];

const hotspots = [
  { id: "floor", scene: 0, x: 31, y: 76, title: "Flooring", material: "Premium natural stone", note: "Large-format finish", price: 185000, warranty: "Verify in catalogue" },
  { id: "wall", scene: 0, x: 68, y: 41, title: "Feature wall", material: "Fluted architectural panel", note: "Custom profile + warm oak tone", price: 94000, warranty: "Verify in catalogue" },
  { id: "light", scene: 0, x: 81, y: 26, title: "Lighting", material: "Layered architectural lighting", note: "Ambient + accent + task", price: 72000, warranty: "Verify in catalogue" },
  { id: "counter", scene: 1, x: 56, y: 58, title: "Countertop", material: "Engineered quartz", note: "Low-maintenance work surface", price: 128000, warranty: "Verify in catalogue" },
  { id: "cabinet", scene: 1, x: 77, y: 37, title: "Cabinetry", material: "Premium acrylic finish", note: "Soft-close hardware ready", price: 264000, warranty: "Verify in catalogue" },
  { id: "wardrobe", scene: 2, x: 76, y: 46, title: "Wardrobe", material: "Custom hardwood-look system", note: "Full-height storage", price: 196000, warranty: "Verify in catalogue" },
  { id: "glazing", scene: 2, x: 23, y: 32, title: "Glazing", material: "Acoustic-performance glazing", note: "Quiet bedroom envelope", price: 86000, warranty: "Verify in catalogue" },
  { id: "study", scene: 3, x: 66, y: 57, title: "Study zone", material: "Integrated desk + storage", note: "Designed to grow with the child", price: 98000, warranty: "Verify in catalogue" },
  { id: "green", scene: 4, x: 63, y: 48, title: "Green edge", material: "Outdoor planting system", note: "Low-maintenance balcony layer", price: 54000, warranty: "Verify in catalogue" },
];

const roomTotals = [
  ["Living", 351000],
  ["Kitchen", 392000],
  ["Master", 282000],
  ["Kids", 98000],
  ["Balcony", 54000],
];

const formatINR = (value: number) => `₹${Math.round(value).toLocaleString("en-IN")}`;

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

export function NiwasthanCinematicExperience() {
  const ref = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);
  const [smooth, setSmooth] = useState(0);
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let target = 0;
    let current = 0;
    let raf = 0;
    const onScroll = () => {
      const el = ref.current;
      if (!el) return;
      const max = Math.max(1, el.offsetHeight - window.innerHeight);
      target = clamp(window.scrollY / max);
      setProgress(target);
    };
    const tick = () => {
      current += (target - current) * 0.12;
      setSmooth(current);
      raf = requestAnimationFrame(tick);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const activeScene = useMemo(() => {
    if (smooth < 0.14) return -1;
    return Math.min(4, Math.floor((smooth - 0.14) / 0.17));
  }, [smooth]);

  const selected = hotspots.find((item) => item.id === activeHotspot) ?? null;
  const boqTotal = roomTotals.reduce((sum, [, value]) => sum + value, 0);
  const door = clamp(smooth / 0.12);
  const discover = clamp((smooth - 0.12) / 0.27);
  const understand = clamp((smooth - 0.39) / 0.21);
  const price = clamp((smooth - 0.60) / 0.15);
  const design = clamp((smooth - 0.75) / 0.12);
  const build = clamp((smooth - 0.87) / 0.13);

  const jump = (p: number) => {
    const el = ref.current;
    if (!el) return;
    const y = el.offsetTop + p * (el.offsetHeight - window.innerHeight);
    window.scrollTo({ top: y, behavior: "smooth" });
    setMenuOpen(false);
  };

  return (
    <main className={styles.shell} ref={ref} aria-label="Niwasthan cinematic home tour">
      <div className={styles.stage}>
        <div className={styles.world} style={{ "--p": smooth } as React.CSSProperties}>
          <header className={styles.header}>
            <button className={styles.logo} onClick={() => jump(0)} aria-label="Niwasthan home">NIWASTHAN</button>
            <nav className={`${styles.nav} ${menuOpen ? styles.navOpen : ""}`} aria-label="Main menu">
              {[[0, "01 Enter"], [0.14, "02 Discover"], [0.39, "03 Understand"], [0.60, "04 Price"], [0.75, "05 Design"], [0.87, "06 Build"]].map(([p, label]) => (
                <button key={label as string} onClick={() => jump(p as number)}>{label}</button>
              ))}
            </nav>
            <button className={styles.boqPill} onClick={() => jump(0.65)} aria-label="View running total">
              <span>Total Estimate</span><strong>{formatINR(price > 0 ? boqTotal : 0)}</strong>
            </button>
            <button className={styles.menuButton} onClick={() => setMenuOpen((v) => !v)} aria-label="Toggle menu">
              {menuOpen ? <X size={18} /> : <ChevronDown size={18} />}
            </button>
          </header>

          <div className={styles.backStack} aria-hidden="true">
            <div className={styles.entrance} style={{ opacity: 1 - door * 0.55, transform: `scale(${1 + door * 0.85})` }}>
              <div className={styles.wallTexture} />
              <div className={styles.doorLeafLeft} style={{ transform: `translateX(${-door * 108}%)` }} />
              <div className={styles.doorLeafRight} style={{ transform: `translateX(${door * 108}%)` }} />
              <div className={styles.nameplate}>NIWASTHAN</div>
            </div>
            {scenes.map((scene, index) => {
              const distance = Math.abs(index - activeScene);
              const opacity = clamp(1 - distance * 1.8) * discover;
              const zoom = 1.03 + clamp((smooth - (0.14 + index * 0.04)) / 0.23) * 0.28;
              return (
                <div key={scene.id} className={styles.sceneLayer} style={{ opacity, transform: `scale(${zoom}) translate3d(${(smooth - 0.5) * -index * 2.5}%, ${(smooth - 0.5) * -index * 1.4}%, 0)` }}>
                  <img src={scene.image} alt="" />
                  <div className={styles.sceneVeil} />
                </div>
              );
            })}
          </div>

          <div className={styles.grain} />
          <div className={styles.vignette} />

          <section className={`${styles.copy} ${styles.enterCopy}`} style={{ opacity: 1 - clamp(smooth / 0.13) }}>
            <span className={styles.kicker}>01 · A different way to begin</span>
            <h1>ENTER<br />YOUR HOME</h1>
            <p>Decide Smart. Live Better.</p>
            <span className={styles.scrollCue}><ArrowDown size={15} /> Scroll to enter</span>
          </section>

          <section className={styles.copy} style={{ opacity: discover * (1 - understand) }}>
            <span className={styles.kicker}>02 · Discover your home</span>
            <h2>SEE THE HOME<br />BEFORE YOU BUILD IT.</h2>
            <p>One continuous cinematic journey through the spaces that make your home yours.</p>
            <div className={styles.roomRail}>{scenes.map((s, i) => <button key={s.id} className={i === activeScene ? styles.roomActive : ""} onClick={() => jump(0.14 + i * 0.04)}>{s.label}</button>)}</div>
          </section>

          <section className={styles.hotspotLayer} style={{ opacity: understand }}>
            {hotspots.map((item) => {
              const visible = item.scene === activeScene;
              return <button key={item.id} className={`${styles.hotspot} ${visible ? styles.hotspotVisible : ""}`} style={{ left: `${item.x}%`, top: `${item.y}%`, transform: `translate(-50%, -50%) scale(${visible ? 1 : 0.45})` }} onClick={() => setActiveHotspot(activeHotspot === item.id ? null : item.id)} aria-label={`Inspect ${item.title}`}>
                <span className={styles.hotspotDot} />
                <span className={styles.hotspotLine} />
              </button>;
            })}
            {selected && <aside className={styles.materialCard}>
              <button className={styles.closeCard} onClick={() => setActiveHotspot(null)} aria-label="Close"><X size={15} /></button>
              <span className={styles.cardKicker}>MATERIAL INTELLIGENCE</span>
              <h3>{selected.title}</h3>
              <strong>{selected.material}</strong>
              <p>{selected.note}</p>
              <div className={styles.specGrid}><span>Indicative item value</span><b>{formatINR(selected.price)}</b><span>Warranty</span><b>{selected.warranty}</b></div>
              <small>Final brand, SKU, price and warranty are verified from the Niwasthan catalogue before purchase.</small>
            </aside>}
          </section>

          <section className={styles.boqPanel} style={{ opacity: price, transform: `translateY(${50 - price * 50}px)` }}>
            <div>
              <span className={styles.kicker}>04 · Price your home</span>
              <h2>KNOW WHAT<br />YOUR HOME COSTS.</h2>
              <p>No mystery quote. No black box. A room-by-room investment view that can resolve down to product, SKU and quantity.</p>
            </div>
            <div className={styles.boqCard}>
              <div className={styles.boqTop}><span>LIVE HOME ESTIMATE</span><strong>{formatINR(boqTotal)}</strong></div>
              {roomTotals.map(([room, value]) => <div className={styles.boqRow} key={room as string}><span>{room}</span><div><i style={{ width: `${(value as number / boqTotal) * 100}%` }} /><b>{formatINR(value as number)}</b></div></div>)}
              <div className={styles.boqFoot}><Check size={14} /> Transparent room-level BOQ</div>
            </div>
          </section>

          <section className={styles.featurePanel} style={{ opacity: design, transform: `translateY(${40 - design * 40}px)` }}>
            <span className={styles.kicker}>05 · Design your home</span>
            <h2>DESIGN INTELLIGENCE<br />THAT FEELS HUMAN.</h2>
            <div className={styles.featureGrid}>
              {[["01", "Discover", "Understand your property, layout, lifestyle and priorities."], ["02", "Design", "AI + expert thinking turns constraints into considered spaces."], ["03", "Visualize", "See materials, rooms and decisions before execution begins."]].map(([n, title, body]) => <article key={n}><span>{n}</span><h3>{title}</h3><p>{body}</p></article>)}
            </div>
          </section>

          <section className={styles.buildPanel} style={{ opacity: build }}>
            <span className={styles.kicker}>06 · Build your home</span>
            <h2>FROM FIRST DECISION<br />TO FINAL HANDOVER.</h2>
            <div className={styles.steps}>{["Procurement", "Execution", "Quality Control", "Handover"].map((step, i) => <div key={step}><span>0{i + 1}</span><b>{step}</b><i /></div>)}</div>
            <button className={styles.finalCta} onClick={() => jump(0)}><span>Start your Niwasthan</span><ArrowRight size={17} /></button>
          </section>
        </div>
      </div>

      <footer className={styles.footer}>
        <div><span>NIWASTHAN</span><p>Homes, thoughtfully designed.<br />Decide Smart. Live Better.</p></div>
        <div className={styles.footerLinks}><button>Contact</button><button>Terms & Conditions</button><button>Privacy</button><button>Refund</button><button>Social</button></div>
        <small>© 2026 Niwasthan. All rights reserved.</small>
      </footer>
    </main>
  );
}
