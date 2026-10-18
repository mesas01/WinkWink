import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { extractInvoiceFields } from "@/services/agent.functions";
import { runAgentDecision } from "@/domain/agent/decide";
import { useAgentStore, type AgentInvoice } from "@/stores/agent-store";

/** 0 idle · 1 extraction · 2 anti-fraud · 3 rules · 4 audit log written */
export type AgentStep = 0 | 1 | 2 | 3 | 4;

const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));
/** Steps B–D are instant; a short beat lets a person follow what the agent checked. */
const STEP_BEAT_MS = 420;

export function useAgentRun() {
  const extract = useServerFn(extractInvoiceFields);
  const recordRun = useAgentStore((s) => s.recordRun);
  const [step, setStep] = useState<AgentStep>(0);
  const [running, setRunning] = useState(false);

  async function run(
    invoice: AgentInvoice,
    file: { mimeType: string; base64: string } | null = null,
  ) {
    setRunning(true);
    setStep(1);
    try {
      const res = await extract({ data: { text: invoice.text, file } });
      if (!res.ok) throw new Error(res.message);
      const { vendors, rules } = useAgentStore.getState();
      const result = runAgentDecision(invoice.id, res.result, vendors, rules);
      for (const s of [2, 3] as const) {
        setStep(s);
        await pause(STEP_BEAT_MS);
      }
      recordRun(invoice.id, res.result, result);
      setStep(4);
      return result.decision;
    } catch (error) {
      setStep(0);
      toast.error(error instanceof Error ? error.message : "Error", { duration: 10_000 });
      return null;
    } finally {
      setRunning(false);
    }
  }

  return { run, step, running, reset: () => setStep(0) };
}
