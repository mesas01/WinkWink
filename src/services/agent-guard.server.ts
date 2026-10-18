import { getRequestIP } from "@tanstack/react-start/server";
import { createRateLimiter, safeEqual } from "@/lib/rate-limit";

/** Guards the paid Gemini call: per-visitor and per-instance budgets, plus an optional access code. */
const perVisitorMinute = createRateLimiter({ limit: 8, windowMs: 60_000 });
const perVisitorDay = createRateLimiter({ limit: 60, windowMs: 86_400_000 });
const perInstanceDay = createRateLimiter({ limit: 600, windowMs: 86_400_000 });

export type GuardResult =
  { ok: true } | { ok: false; reason: "ACCESS_REQUIRED" | "RATE_LIMITED"; message: string };

const accessCode = () => process.env["DEMO_ACCESS_CODE"]?.trim() || null;

export const accessCodeRequired = (): boolean => accessCode() !== null;

function visitorKey(): string {
  try {
    return getRequestIP({ xForwardedFor: true }) ?? "unknown";
  } catch {
    return "unknown";
  }
}

const minutes = (ms: number) => Math.max(1, Math.ceil(ms / 60_000));

export function guardExtraction(code: string | null): GuardResult {
  const expected = accessCode();
  if (expected && !(code && safeEqual(code.trim(), expected)))
    return {
      ok: false,
      reason: "ACCESS_REQUIRED",
      message: "Código de acceso de la demo requerido o incorrecto.",
    };
  const ip = visitorKey();
  for (const check of [perVisitorMinute(ip), perVisitorDay(ip), perInstanceDay("global")]) {
    if (!check.allowed)
      return {
        ok: false,
        reason: "RATE_LIMITED",
        message: `Límite de uso alcanzado. Intenta de nuevo en ${minutes(check.retryAfterMs)} min.`,
      };
  }
  return { ok: true };
}
