import { describe, expect, it } from "vitest";
import { parseBankAccount, sameBankAccount } from "@/domain/agent/bank";
import { checkVendorAccount } from "@/domain/agent/antifraud";
import { evaluateRules, DEFAULT_RULES } from "@/domain/agent/rules";
import { runAgentDecision, overrideDecision } from "@/domain/agent/decide";
import { currentDecisionEvent, supersededIds, statusOfEvent } from "@/domain/agent/audit";
import { extractOffline } from "@/domain/agent/offline-extract";
import { SAMPLE_INVOICES } from "@/domain/agent/samples";
import { VERIFIED_VENDORS, findVerifiedVendor } from "@/domain/agent/vendors";
import type { ExtractedInvoice, ExtractionResult } from "@/domain/agent/types";

const aws: ExtractedInvoice = {
  vendor: "AWS",
  amount: 150,
  currency: "USD",
  category: "software",
  invoiceBankAccount: "Chase ****4321",
  taxId: "US-998822",
  invoiceNumber: "INV-001",
  dueDate: "2026-10-31",
};
const offline = (invoice: ExtractedInvoice): ExtractionResult => ({
  invoice,
  source: "offline",
  model: null,
});
const sample = (id: string) => SAMPLE_INVOICES.find((s) => s.id === id)!;
const decide = (invoice: ExtractedInvoice) =>
  runAgentDecision("T-1", offline(invoice), VERIFIED_VENDORS, DEFAULT_RULES);

describe("bank account comparison", () => {
  it("parses bank name and last four digits", () => {
    expect(parseBankAccount("Chase ****4321")).toEqual({ bank: "chase", last4: "4321" });
  });
  it("matches only same bank and same last four", () => {
    expect(sameBankAccount("Chase ****4321", "chase **** 4321")).toBe(true);
    expect(sameBankAccount("Wells Fargo ****9999", "Chase ****4321")).toBe(false);
    expect(sameBankAccount("Wells Fargo ****4321", "Chase ****4321")).toBe(false);
    expect(sameBankAccount(null, "Chase ****4321")).toBe(false);
  });
});

describe("anti-fraud", () => {
  it("finds vendors by exact alias only", () => {
    expect(findVerifiedVendor("Amazon Web Services", VERIFIED_VENDORS)?.id).toBe("aws");
    expect(findVerifiedVendor("AWS Partner Services", VERIFIED_VENDORS)).toBeNull();
  });
  it("blocks a mismatched bank account with an explained alert", () => {
    const r = checkVendorAccount(
      { ...aws, invoiceBankAccount: "Wells Fargo ****9999" },
      VERIFIED_VENDORS,
    );
    expect(r.kind).toBe("blocked");
    expect(r.message.en).toContain("does not match AWS's pre-verified account in Blinka");
  });
  it("blocks a mismatched tax ID even when the account matches", () => {
    expect(checkVendorAccount({ ...aws, taxId: "US-000000" }, VERIFIED_VENDORS).kind).toBe(
      "blocked",
    );
  });
  it("holds unknown vendors and invoices without an account", () => {
    expect(checkVendorAccount({ ...aws, vendor: "Pixel Norte" }, VERIFIED_VENDORS).kind).toBe(
      "unknown_vendor",
    );
    expect(checkVendorAccount({ ...aws, invoiceBankAccount: null }, VERIFIED_VENDORS).kind).toBe(
      "unverifiable",
    );
  });
});

describe("rules", () => {
  it("auto-approves software under 500 and holds travel over 100", () => {
    expect(evaluateRules(aws, DEFAULT_RULES).action).toBe("approve");
    expect(evaluateRules({ ...aws, category: "travel", amount: 120 }, DEFAULT_RULES).action).toBe(
      "review",
    );
  });
  it("fails closed when no rule matches or currency differs", () => {
    expect(evaluateRules({ ...aws, amount: 900 }, DEFAULT_RULES).action).toBe("none");
    expect(evaluateRules({ ...aws, currency: "COP" }, DEFAULT_RULES).action).toBe("none");
  });
  it("ignores disabled rules", () => {
    const off = DEFAULT_RULES.map((r) => ({ ...r, enabled: false }));
    expect(evaluateRules(aws, off).action).toBe("none");
  });
});

describe("agent decision", () => {
  it("never approves a security-blocked invoice and skips rules", () => {
    const run = decide({ ...aws, invoiceBankAccount: "Wells Fargo ****9999" });
    expect(run.decision.status).toBe("SECURITY_BLOCKED");
    expect(run.decision.bankComparison).toEqual({
      invoiceAccount: "Wells Fargo ****9999",
      verifiedAccount: "Chase ****4321",
    });
    expect(run.events.map((e) => e.kind)).toEqual(["extracted", "security_blocked"]);
  });
  it("holds incomplete invoices", () => {
    expect(decide({ ...aws, amount: null }).decision.status).toBe("HALTED_FOR_REVIEW");
  });
  it("writes one explained event per step", () => {
    const run = decide(aws);
    expect(run.decision.status).toBe("APPROVED");
    expect(run.events.map((e) => e.kind)).toEqual([
      "extracted",
      "security_passed",
      "rule_approved",
    ]);
    expect(run.events.every((e) => e.message.es && e.message.en)).toBe(true);
  });
  it("decides the whole synthetic corpus with zero unsafe approvals", () => {
    const statuses = Object.fromEntries(
      SAMPLE_INVOICES.map((s) => [s.id, decide(extractOffline(s.text)).decision.status]),
    );
    expect(statuses).toEqual({
      "INV-001": "APPROVED",
      "INV-002": "HALTED_FOR_REVIEW",
      "INV-003": "SECURITY_BLOCKED",
      "INV-004": "APPROVED",
      "INV-005": "HALTED_FOR_REVIEW",
      "INV-006": "APPROVED",
    });
  });
});

describe("typed audit events and overrides", () => {
  it("an override supersedes the decision in force, which stays in the log", () => {
    const run = decide({ ...aws, category: "travel", amount: 120 });
    const held = currentDecisionEvent(run.events, "T-1")!;
    const r = overrideDecision("T-1", run.events, "approve", "Admin");
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const events = [...run.events, r.event];
    expect(r.event.supersedes).toBe(held.id);
    expect(supersededIds(events).has(held.id)).toBe(true);
    expect(statusOfEvent(currentDecisionEvent(events, "T-1")!)).toBe("APPROVED");
    expect(events).toHaveLength(run.events.length + 1);
  });
  it("refuses to approve a security block but allows rejecting it", () => {
    const run = decide({ ...aws, invoiceBankAccount: "Wells Fargo ****9999" });
    expect(overrideDecision("T-1", run.events, "approve", "Admin").ok).toBe(false);
    expect(overrideDecision("T-1", run.events, "reject", "Admin").ok).toBe(true);
  });
  it("parses labelled invoice text offline", () => {
    expect(extractOffline(sample("INV-003").text)).toMatchObject({
      vendor: "AWS",
      amount: 150,
      currency: "USD",
      category: "software",
      invoiceBankAccount: "Wells Fargo ****9999",
    });
  });
});

import { createRateLimiter, safeEqual } from "@/lib/rate-limit";

describe("rate limiter and access code", () => {
  it("blocks after the limit and resets after the window", () => {
    const hit = createRateLimiter({ limit: 2, windowMs: 1000 });
    expect(hit("ip", 0).allowed).toBe(true);
    expect(hit("ip", 10).allowed).toBe(true);
    const blocked = hit("ip", 20);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBe(980);
    expect(hit("other", 20).allowed).toBe(true);
    expect(hit("ip", 1001).allowed).toBe(true);
  });
  it("compares access codes exactly", () => {
    expect(safeEqual("jurado-30x", "jurado-30x")).toBe(true);
    expect(safeEqual("jurado-30x", "jurado-30y")).toBe(false);
    expect(safeEqual("jurado", "jurado-30x")).toBe(false);
  });
});
