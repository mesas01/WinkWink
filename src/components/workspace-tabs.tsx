import { Eye, FileText, FolderOpen, Settings, ShieldCheck, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type WorkspaceView = "history" | "rules" | "privacy" | "demo";

interface TabSpec {
  id: WorkspaceView;
  icon: LucideIcon;
  es: string;
  en: string;
  adminOnly?: boolean;
}

const TABS: TabSpec[] = [
  { id: "demo", icon: FileText, es: "Demo de transferencias", en: "Transfer demo" },
  { id: "history", icon: FolderOpen, es: "Facturas", en: "Invoices" },
  {
    id: "rules",
    icon: Settings,
    es: "Reglas y administración",
    en: "Rules & admin",
    adminOnly: true,
  },
  { id: "privacy", icon: ShieldCheck, es: "Privacidad", en: "Privacy" },
];

interface WorkspaceTabsProps {
  view: WorkspaceView;
  onView: (view: WorkspaceView) => void;
  adminUi: boolean;
  isAdmin: boolean;
  employeePreview: boolean;
  onTogglePreview: () => void;
  es: boolean;
}

const tabClass = (active: boolean) =>
  cn(
    "press relative -mb-px inline-flex min-h-11 items-center gap-2 border-b-2 px-1 text-sm font-semibold transition-colors",
    active
      ? "border-ink-violet text-foreground"
      : "border-transparent text-muted-foreground hover:text-foreground",
  );

export function WorkspaceTabs(props: WorkspaceTabsProps) {
  const { view, onView, adminUi, isAdmin, employeePreview, onTogglePreview, es } = props;
  const visible = TABS.filter((t) => adminUi || !t.adminOnly);
  return (
    <nav
      aria-label={es ? "Espacio de trabajo" : "Workspace"}
      className="flex flex-wrap items-end gap-x-6 gap-y-1 border-b"
    >
      {visible.map(({ id, icon: Icon, es: labelEs, en }) => (
        <button
          key={id}
          type="button"
          aria-current={view === id ? "page" : undefined}
          onClick={() => onView(id)}
          className={tabClass(view === id)}
        >
          <Icon className="size-4" />
          {es ? labelEs : en}
        </button>
      ))}
      {isAdmin && (
        <button
          type="button"
          aria-pressed={employeePreview}
          onClick={onTogglePreview}
          className={cn(tabClass(employeePreview), "sm:ml-auto")}
        >
          <Eye className="size-4" />
          {es ? "Vista de empleado" : "Employee view"}
        </button>
      )}
    </nav>
  );
}

export function viewTitle(view: WorkspaceView, adminUi: boolean, es: boolean): string {
  if (view === "demo") return es ? "Transferencias · demo" : "Transfers · demo";
  if (view === "rules") return es ? "Reglas y administración" : "Rules & administration";
  if (view === "privacy") return es ? "Privacidad" : "Privacy";
  if (adminUi) return es ? "Todas las facturas" : "All invoices";
  return es ? "Mis facturas" : "My invoices";
}
