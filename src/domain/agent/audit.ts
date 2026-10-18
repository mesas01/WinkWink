import type { AuditActor, AuditEvent, AuditKind, DecisionStatus, Localized } from "./types";

/** Kinds that carry a decision. Only these can be superseded and struck through. */
export const DECISION_KINDS: ReadonlySet<AuditKind> = new Set<AuditKind>([
  "security_blocked",
  "rule_approved",
  "rule_halted",
  "no_rule",
  "unknown_vendor",
  "incomplete",
  "override_approved",
  "override_rejected",
]);

export const isDecisionEvent = (e: AuditEvent): boolean => DECISION_KINDS.has(e.kind);

let counter = 0;
const nextId = () => `evt-${Date.now().toString(36)}-${(counter++).toString(36)}`;

export function makeEvent(
  invoiceId: string,
  kind: AuditKind,
  actor: AuditActor,
  message: Localized,
  supersedes: string | null = null,
  at: Date = new Date(),
): AuditEvent {
  return { id: nextId(), invoiceId, kind, actor, at: at.toISOString(), message, supersedes };
}

/** Ids of events that a later event replaced. */
export function supersededIds(events: AuditEvent[]): Set<string> {
  return new Set(events.flatMap((e) => (e.supersedes ? [e.supersedes] : [])));
}

/** The decision event currently in force for an invoice: the last one nobody superseded. */
export function currentDecisionEvent(events: AuditEvent[], invoiceId: string): AuditEvent | null {
  const replaced = supersededIds(events);
  const own = events.filter((e) => e.invoiceId === invoiceId && isDecisionEvent(e));
  return [...own].reverse().find((e) => !replaced.has(e.id)) ?? null;
}

export function eventsFor(events: AuditEvent[], invoiceId: string): AuditEvent[] {
  return events.filter((e) => e.invoiceId === invoiceId);
}

const STATUS_BY_KIND: Partial<Record<AuditKind, DecisionStatus>> = {
  security_blocked: "SECURITY_BLOCKED",
  rule_approved: "APPROVED",
  override_approved: "APPROVED",
  override_rejected: "REJECTED",
  rule_halted: "HALTED_FOR_REVIEW",
  no_rule: "HALTED_FOR_REVIEW",
  unknown_vendor: "HALTED_FOR_REVIEW",
  incomplete: "HALTED_FOR_REVIEW",
};

export const statusOfEvent = (e: AuditEvent): DecisionStatus | null =>
  STATUS_BY_KIND[e.kind] ?? null;
