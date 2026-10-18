import { AlertCircle, Check, Clock, Hand, ShieldAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { stampLabel, type StampTone } from "@/lib/stamp";

/** Soft pastel chip per decision. Color is never the only signal: each tone has its own icon. */
const TONE: Record<StampTone, { chip: string; icon: typeof Check }> = {
  approved: { chip: "bg-success-soft text-ok", icon: Check },
  held: { chip: "bg-warning-soft text-hold", icon: Hand },
  blocked: { chip: "bg-destructive-soft text-danger", icon: ShieldAlert },
  rejected: { chip: "bg-destructive-soft text-danger", icon: X },
  pending: { chip: "bg-secondary text-muted-foreground", icon: Clock },
  error: { chip: "bg-destructive-soft text-danger", icon: AlertCircle },
};

interface StampProps {
  tone: StampTone;
  es: boolean;
  size?: "sm" | "lg";
  /** Materializes the chip. Use only at the moment a decision is shown. */
  land?: boolean;
  /** A revoked decision is struck through, never removed. */
  struck?: boolean;
  label?: string;
  className?: string;
}

export function Stamp({ tone, es, size = "sm", land, struck, label, className }: StampProps) {
  const { chip, icon: Icon } = TONE[tone];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center whitespace-nowrap rounded-full font-semibold",
        size === "sm"
          ? "h-6 gap-1 px-2.5 text-[12px]"
          : "h-11 gap-2 px-4 text-[17px] tracking-[-0.01em]",
        chip,
        land && "animate-stamp",
        struck && "line-through decoration-1 opacity-55",
        className,
      )}
    >
      <Icon className={size === "sm" ? "size-3.5" : "size-5"} strokeWidth={2.4} aria-hidden />
      {label ?? stampLabel(tone, es)}
    </span>
  );
}
