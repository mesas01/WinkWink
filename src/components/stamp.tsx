import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { stampLabel, stampTilt, type StampTone } from "@/lib/stamp";

const INK: Record<StampTone, string> = {
  approved: "text-ink-green",
  held: "text-ink-violet",
  blocked: "text-ink-red",
  rejected: "text-ink-red",
  pending: "text-muted-foreground border-dashed",
  error: "text-ink-red border-dashed",
};

interface StampProps {
  tone: StampTone;
  es: boolean;
  size?: "sm" | "lg";
  /** Plays the stamp-in landing. Use only at the moment a decision is shown. */
  land?: boolean;
  /** A revoked decision is struck through, never removed. */
  struck?: boolean;
  label?: string;
  className?: string;
}

export function Stamp({ tone, es, size = "sm", land, struck, label, className }: StampProps) {
  const style: CSSProperties = { rotate: stampTilt(tone) };
  return (
    <span
      style={style}
      className={cn(
        "typed inline-flex shrink-0 items-center whitespace-nowrap rounded-[3px] border-2 border-current font-bold uppercase",
        size === "sm"
          ? "px-2 py-0.5 text-[11px] tracking-[0.08em]"
          : "px-5 py-2 text-3xl tracking-[0.06em] border-[3px]",
        INK[tone],
        tone === "blocked" && size === "lg" && "bg-destructive-soft",
        land && "animate-stamp",
        struck && "line-through decoration-2 opacity-60",
        className,
      )}
    >
      {label ?? stampLabel(tone, es)}
    </span>
  );
}
