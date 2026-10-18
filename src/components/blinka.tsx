import { Moon, Sun } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { useApp } from "@/lib/store";
import { Segmented } from "@/components/segmented";
import { cn } from "@/lib/utils";

/**
 * The WinkWink mark: an app-icon squircle holding a closed eye. The wink is the agent's nod of
 * approval; the lashes read as the three checks it runs (account, tax ID, policy).
 */
export function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={className}>
      <rect width="32" height="32" rx="9" fill="currentColor" />
      <path
        d="M9 14.5c3.9 4.2 10.1 4.2 14 0"
        fill="none"
        stroke="var(--card, #fff)"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M11.6 19.4l-1.4 2.2M16 20.6v2.6M20.4 19.4l1.4 2.2"
        stroke="var(--card, #fff)"
        strokeWidth="2"
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
      className="press -m-1 inline-flex min-h-10 items-center gap-2.5 rounded-xl p-1 text-foreground"
    >
      <Mark className="size-7 text-foreground" />
      <span className="text-[17px] font-semibold tracking-[-0.02em]">WinkWink</span>
    </Link>
  );
}

export function LangSwitch({ className }: { className?: string }) {
  const { lang, setLang } = useApp();
  return (
    <Segmented
      size="sm"
      className={cn(className)}
      label={lang === "es" ? "Idioma" : "Language"}
      value={lang}
      onChange={setLang}
      options={[
        { id: "es", label: "ES" },
        { id: "en", label: "EN" },
      ]}
    />
  );
}

export function ThemeToggle() {
  const { theme, toggleTheme, lang } = useApp();
  const es = lang === "es";
  const label =
    theme === "dark" ? (es ? "Modo claro" : "Light mode") : es ? "Modo oscuro" : "Dark mode";
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className="press glass relative grid size-10 place-items-center overflow-hidden rounded-full text-foreground"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={theme}
          initial={{ opacity: 0, scale: 0.8, rotate: -45, filter: "blur(2px)" }}
          animate={{ opacity: 1, scale: 1, rotate: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 0.8, rotate: 45, filter: "blur(2px)" }}
          transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
        >
          {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
