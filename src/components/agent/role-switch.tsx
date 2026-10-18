import { ADMIN_NAME, EMPLOYEES, type EmployeeName } from "@/domain/agent/samples";
import { useAgentStore, type AgentRole } from "@/stores/agent-store";
import { Segmented } from "@/components/segmented";

const ROLES: { id: AgentRole; es: string; en: string }[] = [
  { id: "employee", es: "Empleado", en: "Employee" },
  { id: "admin", es: "Admin financiero", en: "Finance admin" },
];

/** Demo role switch. It only shapes the demo UI; it grants nothing on any server. */
export function RoleSwitch({ es }: { es: boolean }) {
  const { role, setRole, employee, setEmployee } = useAgentStore();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Segmented
        size="sm"
        label={es ? "Rol de la demo" : "Demo role"}
        value={role}
        onChange={setRole}
        options={ROLES.map((r) => ({ id: r.id, label: es ? r.es : r.en }))}
      />
      {role === "employee" ? (
        <label className="text-xs text-muted-foreground">
          <span className="sr-only">{es ? "Empleado" : "Employee"}</span>
          <select
            value={employee}
            onChange={(e) => setEmployee(e.target.value as EmployeeName)}
            className="glass min-h-9 rounded-full px-3 text-xs font-medium text-foreground"
          >
            {EMPLOYEES.map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </label>
      ) : (
        <span className="hidden text-xs font-medium sm:inline">{ADMIN_NAME}</span>
      )}
    </div>
  );
}
