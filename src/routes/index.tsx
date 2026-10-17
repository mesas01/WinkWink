import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { ArrowRight, Check, FileText, Hand, ScanLine, ShieldCheck, Sparkles } from "lucide-react";
import { useApp } from "@/lib/store";
import { LangSwitch, Logo, ThemeToggle } from "@/components/blinka";
import { LegalLinks } from "@/components/legal";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "WinkWink — Revisión de facturas" },
      {
        name: "description",
        content: "Revisión de documentos y reglas de aprobación, sin ejecutar pagos.",
      },
      { property: "og:title", content: "WinkWink — Revisión de facturas" },
      { property: "og:description", content: "Facturas y decisiones bajo revisión." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const ease = [0.23, 1, 0.32, 1] as const;

const copy = {
  es: {
    nav: ["Cómo funciona", "Reglas", "Control"],
    enter: "Entrar",
    eyebrow: "WinkWink Auto-Approver",
    h1a: "WinkWink.",
    h1b: "Facturas bajo control.",
    sub: "Sube una factura, revisa los datos extraídos y conserva un historial de decisiones. Las excepciones requieren revisión humana. No ejecutamos pagos.",
    cta: "Entrar a WinkWink",
    cta2: "Ver cómo funciona",
    statement:
      "Una factura. Un documento original. Una decisión revisable. La IA puede equivocarse; tus reglas y la revisión humana mantienen el control.",
    howEyebrow: "Cómo funciona",
    howTitle: "Tres pasos. Una decisión revisable.",
    steps: [
      {
        t: "Lee la factura.",
        d: "Extrae proveedor, categoría, monto y fecha de una foto o PDF que subas.",
      },
      {
        t: "Verifica al proveedor.",
        d: "Compara el nombre extraído con la lista configurada por administración. Los proveedores no verificados requieren revisión.",
      },
      {
        t: "Decide con tus reglas.",
        d: "Propone una aprobación cuando se cumplen las reglas; las excepciones pasan a revisión humana.",
      },
    ],
    outEyebrow: "Ejemplos de revisión",
    outTitle: "Cada decisión, con contexto.",
    paid: "Aprobada por regla",
    paidLog: "Aprobado automáticamente. Categoría Software y monto ($150) bajo el umbral de $500.",
    review: "Requiere revisión humana",
    reviewLog: "Revisión requerida. El monto ($120) excede el límite de $100 para Viáticos.",
    approve: "Aprobar excepción",
    reject: "Rechazar",
    rulesEyebrow: "Ejemplos de reglas",
    rulesTitle: "Tú pones los límites.\nEl agente los respeta.",
    rules: [
      "Auto-aprobar Software/SaaS menor a $500",
      "Revisar Viáticos mayores a $100",
      "Detener cualquier proveedor desconocido",
    ],
    finalTitle: "WinkWink.\nTú conservas el control.",
    finalCta: "Entrar a WinkWink",
    foot: "Hecho para el Reto Blinka · 30X Hackradar",
  },
  en: {
    nav: ["How it works", "Rules", "Control"],
    enter: "Sign in",
    eyebrow: "WinkWink Auto-Approver",
    h1a: "WinkWink.",
    h1b: "Invoices under control.",
    sub: "Upload an invoice, inspect extracted fields and keep a decision history. Exceptions require human review. No payments are executed.",
    cta: "Enter WinkWink",
    cta2: "See how it works",
    statement:
      "One invoice. One original document. One reviewable decision. AI can make mistakes; your rules and human review keep you in control.",
    howEyebrow: "How it works",
    howTitle: "Three steps. A reviewable decision.",
    steps: [
      {
        t: "Reads the invoice.",
        d: "Extracts vendor, category, amount and date from an uploaded photo or PDF.",
      },
      {
        t: "Verifies the vendor.",
        d: "Compares the extracted name with the administrator-configured vendor list. Unverified vendors require review.",
      },
      {
        t: "Decides with your rules.",
        d: "Marks compliant invoices approved; exceptions are routed for human review.",
      },
    ],
    outEyebrow: "Review examples",
    outTitle: "Every decision, in context.",
    paid: "Approved by rule",
    paidLog:
      "Approved automatically. Category is Software and amount ($150) is under the $500 threshold.",
    review: "Requires human review",
    reviewLog: "Review required. Amount ($120) exceeds the $100 limit for Travel.",
    approve: "Approve override",
    reject: "Reject",
    rulesEyebrow: "Example rules",
    rulesTitle: "You set the limits.\nThe agent respects them.",
    rules: [
      "Auto-approve Software/SaaS under $500",
      "Review Travel over $100",
      "Halt any unknown vendor",
    ],
    finalTitle: "WinkWink.\nYou keep control.",
    finalCta: "Enter WinkWink",
    foot: "Built for the Blinka Challenge · 30X Hackradar",
  },
};

function Landing() {
  const lang = useApp((s) => s.lang);
  const c = copy[lang];
  return (
    <div className="bg-background font-display text-foreground">
      <Nav c={c} />
      <Hero c={c} />
      <Statement text={c.statement} />
      <How c={c} />

      <Outcomes c={c} />
      <Rules c={c} />
      <Final c={c} />
    </div>
  );
}
type C = (typeof copy)["es"];

function Nav({ c }: { c: C }) {
  const { scrollY } = useScroll();
  const [solid, setSolid] = useState(false);
  useMotionValueEvent(scrollY, "change", (v) => setSolid(v > 12));
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setSignedIn(Boolean(data.user)));
  }, []);
  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,border-color] duration-300",
        solid ? "glass border-b" : "border-b border-transparent",
      )}
    >
      <div className="mx-auto grid grid-cols-[minmax(0,1fr)_auto] gap-3 min-h-16 max-w-6xl items-center justify-between px-6">
        <Logo />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LangSwitch className="hidden sm:inline-flex" />
          <Button asChild>
            <Link to={signedIn ? "/dashboard" : "/login"}>{signedIn ? "WinkWink" : c.enter}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function Words({
  text,
  delay = 0,
  className,
  wordClass,
}: {
  text: string;
  delay?: number;
  className?: string;
  wordClass?: string;
}) {
  return (
    <span className={className}>
      {text.split(" ").map((w, i) => (
        <motion.span
          key={i}
          className="inline-block pb-[0.08em]"
          initial={{ opacity: 0, transform: "translateY(18px)", filter: "blur(8px)" }}
          animate={{ opacity: 1, transform: "translateY(0px)", filter: "blur(0px)" }}
          transition={{ delay: delay + i * 0.06, duration: 0.7, ease }}
        >
          <span className={wordClass}>{w}</span>&nbsp;
        </motion.span>
      ))}
    </span>
  );
}

function Hero({ c }: { c: C }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "start 20%"] });
  const rotate = useTransform(scrollYProgress, [0, 1], [18, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.88, 1]);
  const transform = useTransform(
    [rotate, scale] as MotionValue<number>[],
    ([r, s]) => `perspective(1600px) rotateX(${r}deg) scale(${s})`,
  );
  return (
    <section className="relative overflow-hidden pt-36">
      <div
        aria-hidden
        className="hero-glow pointer-events-none absolute inset-x-0 top-0 h-[720px]"
      />
      <div className="relative mx-auto max-w-5xl px-6 text-center">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="text-sm font-semibold text-primary"
        >
          {c.eyebrow}
        </motion.p>
        <h1 className="text-display mt-4 break-words">
          <Words text={c.h1a} delay={0.1} className="block" />
          <Words text={c.h1b} delay={0.35} className="block" wordClass="text-gradient" />
        </h1>
        <motion.p
          initial={{ opacity: 0, transform: "translateY(10px)" }}
          animate={{ opacity: 1, transform: "translateY(0px)" }}
          transition={{ delay: 0.8, duration: 0.6, ease }}
          className="mx-auto mt-6 max-w-2xl text-lead text-muted-foreground"
        >
          {c.sub}
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="mt-9 flex flex-wrap items-center justify-center gap-4"
        >
          <Link
            to="/login"
            className="press inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-[15px] font-medium text-primary-foreground shadow-cta"
          >
            {c.cta}
            <ArrowRight className="size-4" />
          </Link>
          <a
            href="#how"
            className="group inline-flex items-center gap-1 text-[15px] font-medium text-primary"
          >
            {c.cta2}
            <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </a>
        </motion.div>
      </div>
      <div ref={ref} className="relative mx-auto mt-20 max-w-5xl px-6 pb-24">
        <motion.div
          style={{ transform }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.8 }}
          className="origin-top rounded-[28px] bg-card p-2 shadow-hero"
        >
          <ProductMock c={c} />
        </motion.div>
      </div>
    </section>
  );
}

function ProductMock({ c }: { c: C }) {
  const rows = [
    ["INV-001", "AWS", "$150", "paid"],
    ["INV-002", "Uber", "$120", "review"],
    ["INV-003", "Unknown Design Agency", "$2,000", "review"],
    ["INV-004", "Slack", "$45", "paid"],
  ] as const;
  return (
    <div className="overflow-hidden rounded-[22px] border bg-surface">
      <div className="flex items-center gap-1.5 border-b bg-background px-4 py-3">
        {[0, 1, 2].map((i) => (
          <span key={i} className="size-2.5 rounded-full bg-input" />
        ))}
        <span className="ml-3 text-xs text-muted-foreground">WinkWink · Ejemplo / Example</span>
      </div>
      <div className="grid gap-4 p-5 md:grid-cols-[1.4fr_1fr]">
        <div className="rounded-xl bg-background shadow-crisp">
          {rows.map(([id, v, a, s], i) => (
            <motion.div
              key={id}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 + i * 0.08, duration: 0.4 }}
              className="flex items-center gap-3 border-b px-4 py-3 text-left text-sm last:border-b-0"
            >
              <span className="hidden sm:block w-16 shrink-0 font-mono text-[11px] text-muted-foreground">
                {id}
              </span>
              <span className="min-w-0 flex-1 truncate font-medium">{v}</span>
              <span className="tnum font-medium">{a}</span>
              <span
                className={cn(
                  "hidden sm:block shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
                  s === "paid" ? "bg-success-soft text-success" : "bg-warning-soft text-warning",
                )}
              >
                {s === "paid" ? c.paid : c.review}
              </span>
            </motion.div>
          ))}
        </div>
        <div className="flex flex-col gap-3 rounded-xl bg-background p-4 text-left shadow-crisp">
          <p className="font-mono text-[11px] text-muted-foreground">INV-002 · Uber</p>
          <p className="tnum text-3xl font-semibold tracking-tight">$120</p>
          <p className="rounded-md bg-surface p-2.5 font-mono text-[11px] leading-relaxed">
            {c.reviewLog}
          </p>
          <div className="mt-auto grid grid-cols-2 gap-2">
            <span className="rounded-lg bg-primary py-2 text-center text-xs font-medium text-primary-foreground">
              {c.approve}
            </span>
            <span className="rounded-lg py-2 text-center text-xs font-medium text-destructive shadow-crisp">
              {c.reject}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Statement({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "end 45%"] });
  const words = text.split(" ");
  return (
    <section className="mx-auto max-w-4xl px-6 py-32">
      <p ref={ref} className="text-statement">
        {words.map((w, i) => (
          <Word key={i} p={scrollYProgress} range={[i / words.length, (i + 1) / words.length]}>
            {w}
          </Word>
        ))}
      </p>
    </section>
  );
}
function Word({
  p,
  range,
  children,
}: {
  p: MotionValue<number>;
  range: [number, number];
  children: string;
}) {
  const opacity = useTransform(p, range, [1, 1]);
  return <motion.span style={{ opacity }}>{children} </motion.span>;
}

function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, transform: "translateY(24px)" }}
      whileInView={{ opacity: 1, transform: "translateY(0px)" }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ delay, duration: 0.8, ease }}
    >
      {children}
    </motion.div>
  );
}

function How({ c }: { c: C }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [active, setActive] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => setActive(Math.min(2, Math.floor(v * 3))));
  const icons = [ScanLine, ShieldCheck, Sparkles];
  return (
    <section id="how" ref={ref} className="relative bg-surface py-16 lg:h-[250dvh] lg:py-0">
      <div className="flex items-center lg:sticky lg:top-0 lg:min-h-dvh">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-6 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold text-primary">{c.howEyebrow}</p>
            <h2 className="text-headline mt-3">{c.howTitle}</h2>
            <ol className="mt-10 flex flex-col gap-6">
              {c.steps.map((s, i) => (
                <li
                  key={i}
                  className="flex gap-4 transition-opacity duration-500"
                  style={{ opacity: 1 }}
                >
                  <span className="relative mt-1 h-12 w-0.5 shrink-0 overflow-hidden rounded-full bg-input">
                    <motion.span
                      className="absolute inset-0 origin-top bg-primary"
                      animate={{ transform: `scaleY(${active >= i ? 1 : 0})` }}
                      transition={{ duration: 0.5, ease }}
                    />
                  </span>
                  <div>
                    <p className="text-xl font-semibold tracking-tight">{s.t}</p>
                    <p className="mt-1 text-muted-foreground">{s.d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <div className="relative hidden lg:grid aspect-square place-items-center rounded-[32px] bg-background shadow-hero">
            {icons.map((Icon, i) => (
              <motion.div
                key={i}
                className="absolute flex flex-col items-center gap-6"
                animate={{
                  opacity: active === i ? 1 : 0,
                  transform: active === i ? "scale(1)" : "scale(0.94)",
                  filter: active === i ? "blur(0px)" : "blur(6px)",
                }}
                transition={{ type: "spring", bounce: 0, duration: 0.5 }}
              >
                <span className="grid size-28 place-items-center rounded-[28px] bg-primary-soft text-primary">
                  <Icon className="size-12" strokeWidth={1.5} />
                </span>
                <span className="font-mono text-sm text-muted-foreground">0{i + 1} / 03</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Outcomes({ c }: { c: C }) {
  return (
    <section id="control" className="mx-auto max-w-6xl px-6 py-24">
      <Reveal className="text-center">
        <p className="text-sm font-semibold text-primary">{c.outEyebrow}</p>
        <h2 className="text-headline mt-3">{c.outTitle}</h2>
      </Reveal>
      <div className="mt-16 grid gap-6 md:grid-cols-2">
        <Reveal className="tile">
          <span className="grid size-12 place-items-center rounded-2xl bg-success-soft text-success">
            <Check className="size-6" />
          </span>
          <p className="mt-8 text-3xl font-semibold tracking-tight">{c.paid}</p>
          <p className="mt-4 font-mono text-sm leading-relaxed text-muted-foreground">
            {c.paidLog}
          </p>
        </Reveal>
        <Reveal className="tile" delay={0.1}>
          <span className="grid size-12 place-items-center rounded-2xl bg-warning-soft text-warning">
            <Hand className="size-6" />
          </span>
          <p className="mt-8 text-3xl font-semibold tracking-tight">{c.review}</p>
          <p className="mt-4 font-mono text-sm leading-relaxed text-muted-foreground">
            {c.reviewLog}
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <span className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
              {c.approve}
            </span>
            <span className="rounded-full px-4 py-2 text-sm font-medium text-destructive shadow-crisp">
              {c.reject}
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Rules({ c }: { c: C }) {
  return (
    <section id="rules" className="bg-surface py-32">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-6 lg:grid-cols-2">
        <Reveal>
          <p className="text-sm font-semibold text-primary">{c.rulesEyebrow}</p>
          <h2 className="text-headline mt-3 whitespace-pre-line">{c.rulesTitle}</h2>
        </Reveal>
        <div className="flex flex-col gap-3">
          {c.rules.map((r, i) => (
            <Reveal
              key={i}
              delay={i * 0.08}
              className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg bg-background p-5 shadow-crisp"
            >
              <FileText className="size-5 shrink-0 text-primary" />
              <span className="min-w-0 flex-1 break-words font-medium">{r}</span>
              <span className="relative h-6 w-10 shrink-0 rounded-full bg-primary">
                <span className="absolute right-0.5 top-0.5 size-5 rounded-full bg-background" />
              </span>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Final({ c }: { c: C }) {
  return (
    <section className="px-6 pb-16 pt-40 text-center">
      <Reveal>
        <h2 className="text-display whitespace-pre-line">{c.finalTitle}</h2>
        <Link
          to="/login"
          className="press mt-10 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-base font-medium text-primary-foreground shadow-cta"
        >
          {c.finalCta}
          <ArrowRight className="size-4" />
        </Link>
      </Reveal>
      <footer className="mx-auto mt-20 flex flex-col gap-5 max-w-6xl items-start border-t pt-6 text-xs text-muted-foreground">
        <Logo />
        <span>{c.foot} · Santiago Mesa</span>
        <LegalLinks />
      </footer>
    </section>
  );
}
