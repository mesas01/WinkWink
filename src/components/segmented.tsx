import { useId } from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SegmentOption<T extends string> {
  id: T;
  label: string;
  icon?: LucideIcon;
  /** Short trailing figure, e.g. a count. */
  meta?: string;
}

interface SegmentedProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  size?: "sm" | "md";
  /** "page" for navigation (aria-current), "toggle" for state (aria-pressed). */
  role?: "page" | "toggle";
  className?: string;
}

/** Critically damped spring: settles without overshoot, as Apple ships for repositioning. */
const SPRING = { type: "spring", bounce: 0, duration: 0.38 } as const;

/**
 * Apple-style segmented control on a glass track. The selected pill is one shared element that
 * glides between segments, so the motion explains where the selection went.
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  size = "md",
  role = "toggle",
  className,
}: SegmentedProps<T>) {
  const group = useId();
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "glass inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-full p-1 [scrollbar-width:none]",
        className,
      )}
    >
      {options.map(({ id, label: text, icon: Icon, meta }) => {
        const active = id === value;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            aria-current={role === "page" && active ? "page" : undefined}
            aria-pressed={role === "toggle" ? active : undefined}
            className={cn(
              "press relative inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full font-medium transition-colors",
              size === "sm" ? "min-h-8 px-3 text-[12px]" : "min-h-9 px-4 text-[13px]",
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${group}`}
                transition={SPRING}
                className="absolute inset-0 rounded-full bg-card shadow-[0_1px_3px_rgb(0_0_0/0.1),0_0_0_0.5px_rgb(0_0_0/0.04)] dark:bg-white/14"
              />
            )}
            <span className="relative inline-flex items-center gap-1.5">
              {Icon && <Icon className="size-4" strokeWidth={2} />}
              {text}
              {meta && <span className="tnum text-[11px] text-muted-foreground">{meta}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}
