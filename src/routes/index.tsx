import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ScanLine, ShieldCheck, Scale } from "lucide-react";
import { useApp } from "@/lib/store";
import { LangSwitch, Logo, ThemeToggle } from "@/components/blinka";
import { LegalLinks } from "@/components/legal";
import { Stamp } from "@/components/stamp";
import type { StampTone } from "@/lib/stamp";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "WinkWink — Facturas bajo control" },
      {
        name: "description",
        content:
          "Agente de gobernanza y antifraude para cuentas por pagar en Blinka: paga, retiene o bloquea cada factura y explica por qué.",
      },
      { property: "og:title", content: "WinkWink — Facturas bajo control" },
      { property: "og:description", content: "Cada factura, sellada con su decisión y su porqué." },
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
    blocked: "Bloqueada por seguridad",
    blockedLog:
      "ALERTA DE SEGURIDAD: la cuenta de la factura (Wells Fargo ****9999) no coincide con la cuenta verificada de AWS en Blinka (Chase ****4321). Pago bloqueado para prevenir fraude.",
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
    blocked: "Blocked by security",
    blockedLog:
      "SECURITY ALERT: the bank account on the invoice (Wells Fargo ****9999) does not match AWS's pre-verified account in Blinka (Chase ****4321). Payment blocked to prevent fraud.",
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

type C = (typeof copy)["es"];

function Landing() {
  const lang = useApp((s) => s.lang);
  const c = copy[lang];
  const es = lang === "es";
  return (
    <div className="bg-background text-foreground">
      <Nav c={c} es={es} />
      <main>
        <Hero c={c} es={es} />
        <How c={c} />
        <Outcomes c={c} es={es} />
        <Rules c={c} />
        <Final c={c} />
      </main>
    </div>
  );
}

function Nav({ c, es }: { c: C; es: boolean }) {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setSignedIn(Boolean(data.user)));
  }, []);
  return (
    <header className="sticky top-0 z-50 border-b-2 border-rule bg-background">
      <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-3 px-5 sm:px-8">
        <Logo />
        <nav
          aria-label={es ? "Secciones" : "Sections"}
          className="hidden items-center gap-6 text-sm font-semibold md:flex"
        >
          {["#how", "#control", "#rules"].map((href, i) => (
            <a
              key={href}
              href={href}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {c.nav[i]}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <LangSwitch className="hidden sm:inline-flex" />
          <ThemeToggle />
          <Button asChild>
            <Link to={signedIn ? "/dashboard" : "/login"}>{signedIn ? "WinkWink" : c.enter}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function Hero({ c, es }: { c: C; es: boolean }) {
  return (
    <section className="mx-auto grid max-w-6xl gap-12 px-5 pb-20 pt-14 sm:px-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-center lg:pt-20">
      <div>
        <h1 className="text-display lg:text-[clamp(3.5rem,5.2vw,4.75rem)]">
          {c.h1a}
          <span className="block text-ink-violet">{c.h1b}</span>
        </h1>
        <p className="mt-6 max-w-xl text-lead text-muted-foreground">{c.sub}</p>
        <div className="mt-9 flex flex-wrap items-center gap-3">
          <Button asChild size="lg">
            <Link to="/login">
              {c.cta}
              <ArrowRight />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href="#how">{c.cta2}</a>
          </Button>
        </div>
      </div>
      <LedgerMock c={c} es={es} />
    </section>
  );
}

const MOCK_ROWS: { id: string; vendor: string; amount: string; tone: StampTone }[] = [
  { id: "INV-001", vendor: "AWS", amount: "USD 150.00", tone: "paid" },
  { id: "INV-002", vendor: "Uber", amount: "USD 120.00", tone: "held" },
  { id: "INV-003", vendor: "AWS", amount: "USD 150.00", tone: "blocked" },
  { id: "INV-004", vendor: "Slack", amount: "USD 45.00", tone: "paid" },
];

/** Synthetic example ledger. The stamps land one after another: the agent deciding, row by row. */
function LedgerMock({ c, es }: { c: C; es: boolean }) {
  return (
    <figure className="border-2 border-rule bg-card shadow-hero">
      <figcaption className="flex items-center justify-between border-b-2 border-rule px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.08em]">
        <span>{es ? "Cola de facturas" : "Invoice queue"}</span>
        <span className="text-muted-foreground">
          {es ? "Ejemplo sintético" : "Synthetic example"}
        </span>
      </figcaption>
      <ul>
        {MOCK_ROWS.map((r, i) => (
          <li
            key={r.id}
            className={cn(
              "grid grid-cols-[minmax(0,1fr)_auto_7.5rem] items-center gap-4 border-b border-dashed border-input px-4 py-3.5 last:border-b-0",
              r.tone === "blocked" && "bg-destructive-soft/60",
            )}
          >
            <span className="min-w-0">
              <span className="block truncate font-semibold">{r.vendor}</span>
              <span className="typed text-xs text-muted-foreground">{r.id}</span>
            </span>
            <span className="typed text-sm font-bold">{r.amount}</span>
            <span
              className="justify-self-end [&>span]:[animation-delay:var(--d)]"
              style={{ ["--d" as string]: `${0.5 + i * 0.35}s` }}
            >
              <Stamp tone={r.tone} es={es} land />
            </span>
          </li>
        ))}
      </ul>
      <p className="typed border-t-2 border-rule px-4 py-3 text-[13px] leading-relaxed text-ink-red">
        {c.blockedLog}
      </p>
    </figure>
  );
}

function Reveal({
  children,
  className,
  delay = 0,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "li";
}) {
  const Tag = as === "li" ? motion.li : motion.div;
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, transform: "translateY(16px)" }}
      whileInView={{ opacity: 1, transform: "translateY(0px)" }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ delay, duration: 0.6, ease }}
    >
      {children}
    </Tag>
  );
}

const STEP_ICONS = [ScanLine, ShieldCheck, Scale];

function How({ c }: { c: C }) {
  return (
    <section id="how" className="scroll-mt-20 border-y-2 border-rule bg-surface">
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <h2 className="text-headline max-w-2xl">{c.howTitle}</h2>
        <p className="text-statement mt-8 max-w-4xl text-muted-foreground">{c.statement}</p>
        <ol className="mt-14 grid gap-0 md:grid-cols-3">
          {c.steps.map((s, i) => {
            const Icon = STEP_ICONS[i] ?? ScanLine;
            return (
              <Reveal
                as="li"
                key={s.t}
                delay={i * 0.08}
                className="border-t-2 border-rule py-6 md:border-l md:border-t-2 md:border-l-input md:px-6 md:first:border-l-0 md:first:pl-0"
              >
                <span className="flex items-center gap-3">
                  <span className="typed text-sm font-bold text-ink-violet">{i + 1}/3</span>
                  <Icon className="size-5 text-muted-foreground" strokeWidth={1.75} />
                </span>
                <p className="mt-4 text-xl font-bold tracking-[-0.01em]">{s.t}</p>
                <p className="mt-2 leading-relaxed text-muted-foreground">{s.d}</p>
              </Reveal>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

function Outcomes({ c, es }: { c: C; es: boolean }) {
  const entries: { tone: StampTone; title: string; log: string }[] = [
    { tone: "paid", title: c.paid, log: c.paidLog },
    { tone: "held", title: c.review, log: c.reviewLog },
    { tone: "blocked", title: c.blocked, log: c.blockedLog },
  ];
  return (
    <section id="control" className="mx-auto max-w-6xl scroll-mt-20 px-5 py-24 sm:px-8">
      <h2 className="text-headline max-w-2xl">{c.outTitle}</h2>
      <div className="mt-12 border-y-2 border-rule">
        {entries.map((e, i) => (
          <Reveal
            key={e.tone}
            delay={i * 0.06}
            className="grid gap-4 border-b border-dashed border-input py-7 last:border-b-0 md:grid-cols-[15rem_minmax(0,1fr)] md:items-start"
          >
            <Stamp tone={e.tone} es={es} size="lg" className="justify-self-start text-xl" />
            <div>
              <p className="text-2xl font-bold tracking-[-0.015em]">{e.title}</p>
              <p
                className={cn(
                  "typed mt-2 max-w-3xl leading-relaxed",
                  e.tone === "blocked" ? "text-ink-red" : "text-muted-foreground",
                )}
              >
                {e.log}
              </p>
              {e.tone === "held" && (
                <div className="mt-4 flex flex-wrap gap-2" aria-hidden>
                  <span className="inline-flex min-h-9 items-center rounded-[3px] bg-foreground px-3 text-sm font-semibold text-background">
                    {c.approve}
                  </span>
                  <span className="inline-flex min-h-9 items-center rounded-[3px] border border-input px-3 text-sm font-semibold text-ink-red">
                    {c.reject}
                  </span>
                </div>
              )}
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function Rules({ c }: { c: C }) {
  return (
    <section id="rules" className="scroll-mt-20 border-y-2 border-rule bg-surface">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-24 sm:px-8 lg:grid-cols-2 lg:items-center">
        <h2 className="text-headline whitespace-pre-line">{c.rulesTitle}</h2>
        <ul className="border-y-2 border-rule">
          {c.rules.map((r, i) => (
            <Reveal
              as="li"
              key={r}
              delay={i * 0.06}
              className="flex items-center gap-4 border-b border-dashed border-input py-4 last:border-b-0"
            >
              <span className="typed text-sm font-bold text-ink-violet">R{i + 1}</span>
              <span className="min-w-0 flex-1 font-semibold">{r}</span>
              <span aria-hidden className="relative h-6 w-10 shrink-0 rounded-full bg-foreground">
                <span className="absolute right-0.5 top-0.5 size-5 rounded-full bg-background" />
              </span>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Final({ c }: { c: C }) {
  return (
    <section className="px-5 pt-28 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-display whitespace-pre-line">{c.finalTitle}</h2>
        <Button asChild size="lg" className="mt-10">
          <Link to="/login">
            {c.finalCta}
            <ArrowRight />
          </Link>
        </Button>
        <footer className="mt-24 flex flex-col gap-4 border-t-2 border-rule py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>{c.foot} · Santiago Mesa</span>
          <LegalLinks />
        </footer>
      </div>
    </section>
  );
}
