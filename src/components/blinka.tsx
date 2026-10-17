import { Moon, Sun } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** The WinkWink seal: a notary ring with a closed eye (the wink) at its centre. */
function Seal({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={className}>
      <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" strokeWidth="2.25" />
      <circle
        cx="16"
        cy="16"
        r="10.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="1.6 1.6"
      />
      <path
        d="M10 15.5c3.4 3.6 8.6 3.6 12 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo() {
  const es = useApp((s) => s.lang) === "es";
  return (
    <Link
      to="/"
      aria-label={es ? "WinkWink — inicio" : "WinkWink — home"}
      className="press -m-1 inline-flex min-h-11 items-center gap-2 rounded-[3px] p-1 text-foreground"
    >
      <Seal className="size-8 -rotate-6 text-ink-violet" />
      <span className="text-lg font-extrabold tracking-[-0.02em]">WinkWink</span>
    </Link>
  );
}

export function LangSwitch({ className }: { className?: string }) {
  const { lang, setLang } = useApp();
  return (
    <div
      role="group"
      aria-label={lang === "es" ? "Idioma" : "Language"}
      className={cn(
        "inline-flex items-center rounded-[3px] border border-input text-xs font-semibold",
        className,
      )}
    >
      {(["es", "en"] as const).map((l) => (
        <button
          type="button"
          key={l}
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          title={l === "es" ? "Español" : "English"}
          className={cn(
            "press min-h-10 px-2.5 uppercase tracking-[0.06em] first:rounded-l-[2px] last:rounded-r-[2px]",
            lang === l
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

export function ThemeToggle() {
  const { theme, toggleTheme, lang } = useApp();
  const es = lang === "es";
  const label =
    theme === "dark" ? (es ? "Modo claro" : "Light mode") : es ? "Modo oscuro" : "Dark mode";
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className="press relative size-10 overflow-hidden"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={theme}
          initial={{ opacity: 0, transform: "scale(0.8) rotate(-45deg)" }}
          animate={{ opacity: 1, transform: "scale(1) rotate(0deg)" }}
          exit={{ opacity: 0, transform: "scale(0.8) rotate(45deg)" }}
          transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
        >
          {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </motion.span>
      </AnimatePresence>
    </Button>
  );
}
