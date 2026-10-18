import { ADMIN_NAME, EMPLOYEES, type EmployeeName } from "@/domain/agent/samples";
import { useAgentStore, type AgentRole } from "@/stores/agent-store";
import { cn } from "@/lib/utils";

const ROLES: { id: AgentRole; es: string; en: string }[] = [
  { id: "employee", es: "Empleado", en: "Employee" },
  { id: "admin", es: "Admin financiero", en: "Finance admin" },
];

/** Demo role switch. It only shapes the demo UI; it grants nothing on any server. */
export function RoleSwitch({ es }: { es: boolean }) {
  const { role, setRole, employee, setEmployee } = useAgentStore();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div
        role="group"
        aria-label={es ? "Rol de la demo" : "Demo role"}
        className="inline-flex rounded-[3px] border border-input text-xs font-semibold"
      >
        {ROLES.map((r) => (
          <button
            key={r.id}
            type="button"
            aria-pressed={role === r.id}
            onClick={() => setRole(r.id)}
            className={cn(
              "press min-h-10 px-3 first:rounded-l-[2px] last:rounded-r-[2px]",
              role === r.id
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {es ? r.es : r.en}
          </button>
        ))}
      </div>
      {role === "employee" ? (
        <label className="text-xs text-muted-foreground">
          <span className="sr-only">{es ? "Empleado" : "Employee"}</span>
          <select
            value={employee}
            onChange={(e) => setEmployee(e.target.value as EmployeeName)}
            className="min-h-10 rounded-[3px] border border-input bg-background px-2 text-xs font-semibold text-foreground"
          >
            {EMPLOYEES.map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </label>
      ) : (
        <span className="text-xs font-semibold">{ADMIN_NAME}</span>
      )}
    </div>
  );
}
