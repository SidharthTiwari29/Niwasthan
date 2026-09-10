import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  Check,
  ChevronDown,
  Maximize2,
  Menu,
  X,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
} from "react";

const rooms = [
  {
    number: "01",
    name: "Entrance",
    subtitle: "A considered arrival",
    image: "/hero/01-entrance.webp",
    details: [
      "A calm arrival sequence",
      "Layered exterior lighting",
      "Material-led first impression",
    ],
  },
  {
    number: "02",
    name: "Drawing Room",
    subtitle: "First impressions, beautifully composed",
    image: "/hero/02-drawing-room.webp",
    details: [
      "Balanced furniture planning",
      "Warm architectural lighting",
      "A welcoming social setting",
    ],
  },
  {
    number: "03",
    name: "Living Room",
    subtitle: "The heart of everyday life",
    image: "/hero/03-living-room.webp",
    details: [
      "Comfort-first planning",
      "Natural visual rhythm",
      "Spaces designed to connect",
    ],
  },
  {
    number: "04",
    name: "Kitchen",
    subtitle: "Function, flow and material intelligence",
    image: "/hero/04-kitchen.webp",
    details: [
      "Efficient working zones",
      "Integrated storage",
      "Durable material choices",
    ],
  },
  {
    number: "05",
    name: "Master Bedroom",
    subtitle: "Quiet, warm and deeply personal",
    image: "/hero/05-master-bedroom.webp",
    details: [
      "Soft layered lighting",
      "Calm material palette",
      "Private retreat planning",
    ],
  },
  {
    number: "06",
    name: "Kids' Room",
    subtitle: "Playful, practical and ready to grow",
    image: "/hero/06-kids-room.webp",
    details: [
      "Flexible furniture planning",
      "Storage built around routines",
      "Room to evolve over time",
    ],
  },
  {
    number: "07",
    name: "Balcony",
    subtitle: "The final frame: open sky and home",
    image: "/hero/07-balcony.webp",
    details: [
      "A natural pause",
      "Outdoor living potential",
      "An open ending to the journey",
    ],
  },
];

const pillars = [
  [
    "01",
    "See it before you commit",
    "Explore the home visually before important decisions become irreversible.",
  ],
  [
    "02",
    "Know what you are paying for",
    "Understand products, materials and the choices that shape your budget.",
  ],
  [
    "03",
    "Keep control of the plan",
    "Make informed decisions without handing over the entire process blindly.",
  ],
  [
    "04",
    "Build what was approved",
    "Move from an understood design to execution with a clear reference point.",
  ],
];

const processSteps = [
  [
    "01",
    "Tell us about your home",
    "Share your space, needs, taste and priorities.",
  ],
  [
    "02",
    "Shape the design",
    "Explore the rooms and refine the direction around how you want to live.",
  ],
  [
    "03",
    "Understand the cost",
    "See how materials, products and decisions influence the overall budget.",
  ],
  [
    "04",
    "Choose how to execute",
    "Take control yourself or work with Niwasthan to deliver the approved home.",
  ],
];

const faqs = [
  [
    "Is Niwasthan only for turnkey execution?",
    "No. The experience is designed to help you understand the home and make informed decisions first. You can choose how you want the work delivered.",
  ],
  [
    "How is this different from a conventional interior quote?",
    "The focus is on making the design, products, materials and budget relationship easier to understand before you commit.",
  ],
  [
    "Are products and prices guaranteed?",
    "Specific availability and pricing depend on the final selection and project conditions. The goal is to make those variables visible rather than hide them.",
  ],
  [
    "Can I explore the home before signing in?",
    "Yes. The public experience lets you explore the residence and understand the approach before taking the next step.",
  ],
];

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return reduced;
}

function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) {
      return;
    }
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [reduced]);

  return (
    <div
      ref={ref}
      data-reveal
      data-visible={visible}
      className={className}
      style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}

function useRoomCrossfade(progress: number) {
  const count = rooms.length;
  const position = progress * (count - 1);
  return rooms.map((_, index) =>
    clamp(1 - Math.abs(position - index) * 1.35, 0, 1),
  );
}

function SiteNav() {
  const [open, setOpen] = useState(false);
  const links = [
    ["The experience", "#walkthrough"],
    ["The idea", "#idea"],
    ["Why Niwasthan", "#why-niwasthan"],
    ["The promise", "#promise"],
    ["How it works", "#process"],
    ["How it works page", "/how-it-works"],
    ["Plans", "/pricing"],
    ["FAQ", "#faq"],
  ];

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 px-5 py-5 md:px-10 md:py-6">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between rounded-full border border-white/15 bg-black/25 px-4 py-3 shadow-2xl shadow-black/20 backdrop-blur-xl md:px-5">
          <Link
            href="/"
            className="font-display text-xl tracking-[-0.03em] text-white md:text-2xl"
          >
            Niwasthan
          </Link>
          <button
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
            className="grid h-10 w-10 place-items-center rounded-full border border-[#d6b477]/35 bg-[#d6b477]/10 text-[#f1d29a] transition-colors hover:bg-[#d6b477]/20"
          >
            {open ? <X size={17} /> : <Menu size={17} />}
          </button>
        </div>
      </header>
      {open ? (
        <div className="fixed inset-0 z-40 flex flex-col justify-between bg-[#0b0b0a]/98 px-6 pb-10 pt-32 backdrop-blur-2xl">
          <nav className="flex flex-col gap-4">
            {links.map(([label, href], index) => (
              <a
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="flex items-baseline gap-4 border-b border-[#d6b477]/15 pb-4 font-display text-3xl tracking-[-0.03em] text-white sm:text-4xl"
              >
                <span className="font-mono text-[9px] text-[#d6b477]">
                  0{index + 1}
                </span>
                {label}
              </a>
            ))}
          </nav>
          <Link
            href="/sign-in"
            onClick={() => setOpen(false)}
            className="inline-flex w-fit items-center gap-2 rounded-full bg-[#d6b477] px-6 py-3 font-body text-sm font-semibold text-[#11100e]"
          >
            Start your home <ArrowRight size={16} />
          </Link>
        </div>
      ) : null}
    </>
  );
}

function Hero({ imageUrl }: { imageUrl: string }) {
  const [failed, setFailed] = useState(false);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const reduced = useReducedMotion();

  function handlePointerMove(event: PointerEvent<HTMLElement>) {
    if (reduced) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setPointer({
      x: clamp((event.clientX - rect.left) / rect.width - 0.5, -0.5, 0.5),
      y: clamp((event.clientY - rect.top) / rect.height - 0.5, -0.5, 0.5),
    });
  }

  return (
    <section
      className="relative min-h-[100svh] overflow-hidden bg-[#0b0b0a]"
      onPointerMove={handlePointerMove}
      onPointerLeave={() => setPointer({ x: 0, y: 0 })}
    >
      {!failed ? (
        <Image
          src={imageUrl}
          alt="Niwasthan 4BHK home"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
          style={{
            transform: reduced
              ? undefined
              : `scale(1.06) translate3d(${pointer.x * -12}px, ${pointer.y * -8}px, 0)`,
            transition: "transform 700ms cubic-bezier(0.23, 1, 0.32, 1)",
          }}
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_55%_35%,#756a5c_0%,#39342e_34%,#12110f_78%)]" />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/15 to-[#0b0b0a]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_60%_35%,transparent_0%,rgba(0,0,0,.18)_40%,rgba(0,0,0,.72)_100%)]" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[8%] top-[28%] hidden h-64 w-64 rounded-full border border-[#d6b477]/25 lg:block"
        style={{
          transform: reduced
            ? undefined
            : `rotateX(${pointer.y * -14}deg) rotateY(${pointer.x * 18}deg) translate3d(${pointer.x * 22}px, ${pointer.y * 18}px, 0)`,
          transition: "transform 700ms cubic-bezier(0.23, 1, 0.32, 1)",
          transformStyle: "preserve-3d",
        }}
      >
        <div className="absolute inset-7 rounded-full border border-[#d6b477]/20" />
        <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#d6b477] shadow-[0_0_28px_8px_rgba(214,180,119,.35)]" />
        <div className="absolute -right-16 top-10 rounded-full border border-[#d6b477]/30 bg-black/20 px-3 py-2 font-mono text-[8px] uppercase tracking-[0.18em] text-[#d6b477] backdrop-blur-md">
          Real home
        </div>
        <div className="absolute -bottom-5 -left-14 rounded-full border border-white/15 bg-black/20 px-3 py-2 font-mono text-[8px] uppercase tracking-[0.18em] text-white/60 backdrop-blur-md">
          Buildable by design
        </div>
      </div>
      <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-[1440px] flex-col justify-end px-5 pb-14 pt-32 md:px-10 md:pb-20">
        <div className="max-w-5xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-[#d6b477]">
            NIWASTHAN
          </p>
          <h1 className="mt-5 max-w-5xl font-display text-[clamp(4rem,10vw,10rem)] font-semibold leading-[0.8] tracking-[-0.06em] text-[#f6f0e5]">
            A better way
            <br />
            to build home.
          </h1>
          <p className="mt-8 max-w-xl font-body text-base leading-relaxed text-white/65 md:text-lg">
            See the space. Understand the design. Know the cost. Then decide how
            you want it delivered.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#walkthrough"
              className="inline-flex items-center gap-2 rounded-full bg-[#d6b477] px-6 py-3.5 font-body text-sm font-semibold text-[#151310] transition-transform hover:scale-[1.03]"
            >
              Explore the home <ArrowRight size={16} />
            </a>
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-2 rounded-full border border-[#d6b477]/40 bg-black/20 px-6 py-3.5 font-body text-sm font-medium text-[#f5efe3] backdrop-blur-md transition-colors hover:bg-[#d6b477]/10"
            >
              Start your project
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Walkthrough() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const walkthroughRef = useRef<HTMLElement>(null);
  const opacities = useRoomCrossfade(scrollProgress);
  const activeRoom = opacities.reduce(
    (best, opacity, index) => (opacity > opacities[best] ? index : best),
    0,
  );
  useEffect(() => {
    let frame = 0;
    const update = () => {
      const element = walkthroughRef.current;
      if (element) {
        const rect = element.getBoundingClientRect();
        const travel = Math.max(element.offsetHeight - window.innerHeight, 1);
        setScrollProgress(clamp(-rect.top / travel, 0, 1));
      }
      frame = 0;
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", update);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);
  const jumpToRoom = (index: number) => {
    const element = walkthroughRef.current;
    if (!element) return;
    const travel = Math.max(element.offsetHeight - window.innerHeight, 1);
    window.scrollTo({
      top: element.offsetTop + travel * (index / (rooms.length - 1)),
      behavior: "smooth",
    });
  };
  return (
    <section
      ref={walkthroughRef}
      id="walkthrough"
      className="relative h-[720vh] bg-[#0b0b0a]"
    >
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <div className="absolute inset-0">
          {rooms.map((room, index) => (
            <Image
              key={room.name}
              src={room.image}
              alt={room.name}
              fill
              priority={index === 0}
              sizes="100vw"
              className="object-cover object-center"
              style={{
                opacity: opacities[index],
                transition: "opacity 360ms linear, transform 9000ms linear",
                transform: opacities[index] > 0.5 ? "scale(1.06)" : "scale(1)",
                willChange: "opacity, transform",
              }}
            />
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-[#0b0b0a]" />
        <div className="absolute inset-x-0 bottom-0 z-20 px-5 pb-7 md:px-10 md:pb-10">
          <div className="mx-auto max-w-[1440px]">
            <div className="flex items-end justify-between gap-8">
              <div>
                <div className="flex items-center gap-3 font-mono text-[9px] uppercase tracking-[0.2em] text-[#d6b477]">
                  <span>{rooms[activeRoom].number}</span>
                  <span className="h-px w-8 bg-[#d6b477]/60" />
                </div>
                <h3 className="mt-2 font-display text-5xl font-semibold tracking-[-0.04em] text-white sm:text-6xl md:text-7xl">
                  {rooms[activeRoom].name}
                </h3>
                <p className="mt-2 font-body text-sm text-white/60">
                  {rooms[activeRoom].subtitle}
                </p>
              </div>
              <button
                aria-label="View fullscreen"
                onClick={() => document.documentElement.requestFullscreen?.()}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[#d6b477]/30 bg-black/40 text-[#f1d29a] backdrop-blur-md hover:bg-[#d6b477]/10"
              >
                <Maximize2 size={16} />
              </button>
            </div>
            <div className="mt-7 flex gap-1.5">
              {rooms.map((room, index) => (
                <button
                  key={room.name}
                  onClick={() => jumpToRoom(index)}
                  aria-label={`Go to ${room.name}`}
                  className="group relative h-8 flex-1"
                >
                  <span
                    className={`absolute inset-x-0 top-3 h-1 rounded-full transition-all ${index <= activeRoom ? "bg-[#d6b477]" : "bg-white/20"}`}
                  />
                  <span className="absolute left-0 top-5 hidden font-mono text-[8px] uppercase tracking-[0.12em] text-white/45 group-hover:block">
                    {room.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Intro() {
  return (
    <section
      id="idea"
      className="bg-[#0b0b0a] px-5 py-32 text-[#f4efe6] sm:py-40 md:px-10 md:py-52"
    >
      <div className="mx-auto grid max-w-[1440px] gap-16 lg:grid-cols-[.65fr_1.35fr] lg:gap-24">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-[#d6b477]">
            The idea
          </p>
          <div className="mt-8 h-px w-16 bg-[#d6b477]/50" />
        </div>
        <Reveal>
          <h2 className="max-w-6xl font-display text-[clamp(3.8rem,8vw,8.5rem)] font-semibold leading-[0.82] tracking-[-0.06em] text-[#f7f0e4]">
            Your home should never feel like a black box.
          </h2>
          <p className="mt-10 max-w-3xl font-body text-base leading-relaxed text-white/55 md:text-xl">
            Niwasthan brings the important decisions into view. Explore the
            space, understand the design, see how choices influence the budget,
            and decide what happens next with clarity.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function WhyNiwasthan() {
  return (
    <section
      id="why-niwasthan"
      className="bg-[#0b0b0a] px-5 py-32 text-[#f4efe6] sm:py-40 md:px-10 md:py-52"
    >
      <div className="mx-auto max-w-[1440px]">
        <Reveal className="max-w-5xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-[#d6b477]">
            Why Niwasthan
          </p>
          <h2 className="mt-6 font-display text-[clamp(4rem,8vw,8.5rem)] font-semibold leading-[0.8] tracking-[-0.06em]">
            Clarity looks
            <br />
            good on you.
          </h2>
        </Reveal>
        <div className="mt-20 grid overflow-hidden rounded-[2rem] border border-[#d6b477]/20 md:grid-cols-2 lg:grid-cols-4">
          {pillars.map(([number, title, text]) => (
            <article
              key={number}
              className="group relative min-h-[360px] overflow-hidden border-[#d6b477]/15 p-8 md:border-l lg:min-h-[420px] lg:first:border-l-0"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(214,180,119,.14),transparent_45%)] transition-opacity group-hover:opacity-100" />
              <div className="relative flex h-full flex-col">
                <span className="font-mono text-[10px] text-[#d6b477]">
                  {number}
                </span>
                <div className="mt-auto">
                  <h3 className="max-w-[15rem] font-display text-3xl font-semibold leading-[0.95] tracking-[-0.03em] text-white">
                    {title}
                  </h3>
                  <p className="mt-5 font-body text-sm leading-relaxed text-white/48">
                    {text}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Promise() {
  const benefits = [
    "A coherent room-by-room design direction",
    "Product and material decisions you can understand",
    "A budget relationship you can see while choosing",
    "A clear choice between self-execution and Niwasthan execution",
  ];
  return (
    <section
      id="promise"
      className="bg-[#0b0b0a] px-5 py-32 text-[#f4efe6] sm:py-40 md:px-10 md:py-52"
    >
      <div className="mx-auto max-w-[1440px] rounded-[2rem] border border-[#d6b477]/20 bg-[#11100d] p-8 md:p-14 lg:p-20">
        <div className="grid gap-16 lg:grid-cols-[1.1fr_.9fr] lg:gap-24">
          <Reveal>
            <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-[#d6b477]">
              The promise
            </p>
            <h2 className="mt-7 max-w-5xl font-display text-[clamp(4rem,7.5vw,8rem)] font-semibold leading-[0.8] tracking-[-0.06em]">
              Know the home.
              <br />
              <span className="text-[#d6b477]">Own the decision.</span>
            </h2>
            <p className="mt-10 max-w-2xl font-body text-base leading-relaxed text-white/55 md:text-xl">
              We do not believe a beautiful home should require blind trust. You
              should be able to understand the design, the choices and the route
              from idea to execution.
            </p>
          </Reveal>
          <Reveal className="lg:pt-20" delay={100}>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#d6b477]/70">
              What that means
            </p>
            <ul className="mt-7 divide-y divide-[#d6b477]/15 border-y border-[#d6b477]/15">
              {benefits.map((benefit) => (
                <li
                  key={benefit}
                  className="flex gap-4 py-5 font-body text-sm leading-relaxed text-white/70"
                >
                  <Check size={17} className="mt-0.5 shrink-0 text-[#d6b477]" />
                  {benefit}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Process() {
  return (
    <section
      id="process"
      className="bg-[#0b0b0a] px-5 py-32 text-[#f4efe6] sm:py-40 md:px-10 md:py-52"
    >
      <div className="mx-auto max-w-[1440px]">
        <Reveal className="max-w-5xl">
          <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-[#d6b477]">
            How it works
          </p>
          <h2 className="mt-6 font-display text-[clamp(4rem,8vw,8.5rem)] font-semibold leading-[0.8] tracking-[-0.06em]">
            From first idea
            <br />
            to final detail.
          </h2>
          <p className="mt-9 max-w-xl font-body text-base leading-relaxed text-white/50 md:text-lg">
            A simple path from understanding your home to deciding how you want
            to bring it to life.
          </p>
        </Reveal>
        <div className="mt-20 border-t border-[#d6b477]/15">
          {processSteps.map(([number, title, text]) => (
            <article
              key={number}
              className="grid gap-5 border-b border-[#d6b477]/15 py-9 md:grid-cols-[100px_1fr_1fr] md:items-center md:py-12"
            >
              <span className="font-mono text-[10px] text-[#d6b477]">
                {number}
              </span>
              <h3 className="font-display text-3xl font-semibold tracking-[-0.03em] text-white md:text-5xl">
                {title}
              </h3>
              <p className="max-w-md font-body text-sm leading-relaxed text-white/50 md:text-base">
                {text}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section
      id="faq"
      className="bg-[#0b0b0a] px-5 py-32 text-[#f4efe6] sm:py-40 md:px-10 md:py-52"
    >
      <div className="mx-auto grid max-w-[1440px] gap-16 lg:grid-cols-[.75fr_1.25fr] lg:gap-24">
        <Reveal>
          <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-[#d6b477]">
            FAQ
          </p>
          <h2 className="mt-6 max-w-xl font-display text-[clamp(3.5rem,6vw,6.5rem)] font-semibold leading-[0.82] tracking-[-0.06em]">
            Good questions.
            <br />
            Clear answers.
          </h2>
        </Reveal>
        <Reveal className="border-t border-[#d6b477]/15">
          {faqs.map(([question, answer], index) => {
            const isOpen = open === index;
            return (
              <div key={question} className="border-b border-[#d6b477]/15">
                <button
                  id={`faq-question-${index}`}
                  onClick={() => setOpen(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${index}`}
                  className="flex w-full items-center justify-between gap-6 py-7 text-left"
                >
                  <span className="font-display text-2xl font-semibold tracking-[-0.025em] md:text-3xl">
                    {question}
                  </span>
                  <ChevronDown
                    size={19}
                    className={`shrink-0 text-[#d6b477] transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {isOpen ? (
                  <p
                    id={`faq-answer-${index}`}
                    role="region"
                    aria-labelledby={`faq-question-${index}`}
                    className="max-w-2xl pb-8 pr-8 font-body text-sm leading-relaxed text-white/50"
                  >
                    {answer}
                  </p>
                ) : null}
              </div>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-[#d6b477] px-5 py-32 text-[#0d0c0a] sm:py-40 md:px-10 md:py-52">
      <div className="absolute -right-32 -top-40 h-[28rem] w-[28rem] rounded-full border border-black/10" />
      <div className="relative mx-auto max-w-[1100px] text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-black/55">
          Your home starts here
        </p>
        <h2 className="mx-auto mt-6 max-w-5xl font-display text-[clamp(4rem,8vw,8rem)] font-semibold leading-[0.8] tracking-[-0.06em]">
          Stop guessing.
          <br />
          Start designing.
        </h2>
        <p className="mx-auto mt-9 max-w-xl font-body text-base leading-relaxed text-black/60 md:text-lg">
          Explore the Niwasthan experience, then take the first step toward your
          own home.
        </p>
        <Link
          href="/sign-in"
          className="mt-10 inline-flex items-center gap-2 rounded-full bg-[#0d0c0a] px-7 py-4 font-body text-sm font-semibold text-[#f4efe6] transition-transform hover:scale-[1.03]"
        >
          Start with your home <ArrowRight size={17} />
        </Link>
      </div>
    </section>
  );
}

export function CinematicLandingFinal() {
  const heroImage =
    process.env.NEXT_PUBLIC_NIWASTHAN_HERO_IMAGE ?? rooms[0].image;
  return (
    <main className="min-h-screen bg-[#0b0b0a] text-[#f4efe6] selection:bg-[#d6b477] selection:text-[#151310]">
      <SiteNav />
      <Hero imageUrl={heroImage} />
      <Walkthrough />
      <Intro />
      <WhyNiwasthan />
      <Promise />
      <Process />
      <FAQ />
      <FinalCTA />
      <footer className="border-t border-[#d6b477]/15 bg-[#070706] px-5 py-9 text-white/40 md:px-10">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <span className="font-display text-xl text-white">Niwasthan</span>
          <div className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-[8px] uppercase tracking-[0.18em]">
            <a href="#walkthrough" className="hover:text-white">
              Experience
            </a>
            <a href="#process" className="hover:text-white">
              How it works
            </a>
            <a href="#faq" className="hover:text-white">
              FAQ
            </a>
            <a href="mailto:support@niwasthan.com" className="hover:text-white">
              Contact
            </a>
          </div>
        </div>
        <div className="mx-auto mt-8 flex max-w-[1440px] justify-between border-t border-white/10 pt-5 font-mono text-[8px] uppercase tracking-[0.16em] text-white/25">
          <span>Home intelligence</span>
          <span>Project-led</span>
        </div>
      </footer>
    </main>
  );
}
