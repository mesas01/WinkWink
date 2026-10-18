import { Stamp } from "@/components/stamp";
import { decisionStampTone } from "@/lib/stamp";
import { isDecisionEvent, statusOfEvent, supersededIds } from "@/domain/agent/audit";
import type { AuditEvent } from "@/domain/agent/types";
import { cn } from "@/lib/utils";

const ACTOR = {
  agent: { es: "Agente", en: "Agent" },
  admin: { es: "Admin", en: "Admin" },
  employee: { es: "Empleado", en: "Employee" },
};

/** Typed, append-only audit log. A replaced decision stays visible, struck through. */
export function AuditLog({
  events,
  lang,
  es,
}: {
  events: AuditEvent[];
  lang: string;
  es: boolean;
}) {
  const replaced = supersededIds(events);
  return (
    <section className="mt-6 border-t border-hairline pt-4">
      <h3 className="text-sm font-bold">{es ? "Registro de auditoría" : "Audit log"}</h3>
      <ol className="mt-3 grid gap-3">
        {events.map((e) => {
          const struck = replaced.has(e.id);
          return (
            <li
              key={e.id}
              className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 text-[13px] leading-relaxed"
            >
              <span className="typed text-muted-foreground">
                {new Date(e.at).toLocaleString(lang, { dateStyle: "short", timeStyle: "short" })}
              </span>
              <span className={cn(struck && "text-muted-foreground line-through decoration-1")}>
                <span className="typed mr-2 text-xs font-bold uppercase text-muted-foreground">
                  {es ? ACTOR[e.actor].es : ACTOR[e.actor].en}
                </span>
                {es ? e.message.es : e.message.en}
                {isDecisionEvent(e) && (
                  <Stamp
                    tone={decisionStampTone(statusOfEvent(e))}
                    es={es}
                    struck={struck}
                    className="ml-2 align-middle"
                  />
                )}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
