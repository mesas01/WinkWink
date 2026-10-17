import { Moon, Sun, Zap } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { useApp } from "@/lib/store";
import { statusLabel } from "@/lib/i18n";
import type { Status } from "@/lib/agent";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <Link
        to="/"
        aria-label="WinkWink — inicio"
        title="Inicio"
        className="press grid size-11 place-items-center rounded-md bg-primary text-primary-foreground shadow-cta"
      >
        <Zap className="size-4" fill="currentColor" />
      </Link>
      <span className="text-lg font-semibold tracking-tight">WinkWink</span>
    </div>
  );
}

export function LangSwitch({ className }: { className?: string }) {
  const { lang, setLang } = useApp();
  return (
    <div
      role="group"
      aria-label="Language"
      className={cn("inline-flex rounded-lg bg-muted p-0.5 text-xs font-medium", className)}
    >
      {(["es", "en"] as const).map((l) => (
        <Button
          variant="ghost"
          key={l}
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={cn(
            "press rounded-md min-h-11 px-2.5 py-1",
            lang === l
              ? "bg-card text-foreground shadow-crisp"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {l === "es" ? "Español" : "English"}
        </Button>
      ))}
    </div>
  );
}

const tone: Record<Status, string> = {
  pending: "bg-muted text-secondary-foreground",
  paid: "bg-success-soft text-success",
  override: "bg-primary-soft text-primary",
  review: "bg-warning-soft text-warning",
  rejected: "bg-destructive-soft text-destructive",
  security: "bg-destructive-soft text-destructive",
};

export function StatusBadge({ status }: { status: Status }) {
  const lang = useApp((s) => s.lang);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium",
        tone[status],
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {statusLabel(lang, status)}
    </span>
  );
}

export function ThemeToggle() {
  const { theme, toggleTheme, lang } = useApp();
  const label =
    lang === "es"
      ? theme === "dark"
        ? "Modo claro"
        : "Modo oscuro"
      : theme === "dark"
        ? "Light mode"
        : "Dark mode";
  return (
    <Button
      variant="ghost"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className="press relative grid size-11 place-items-center overflow-hidden rounded-lg bg-muted text-foreground"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={theme}
          initial={{ opacity: 0, transform: "scale(0.9) rotate(-60deg)", filter: "blur(2px)" }}
          animate={{ opacity: 1, transform: "scale(1) rotate(0deg)", filter: "blur(0px)" }}
          exit={{ opacity: 0, transform: "scale(0.9) rotate(60deg)", filter: "blur(2px)" }}
          transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
        >
          {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </motion.span>
      </AnimatePresence>
    </Button>
  );
}
