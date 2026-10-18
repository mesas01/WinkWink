import { Eye, FileText, FolderOpen, Settings, ShieldCheck, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Segmented } from "@/components/segmented";

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

export function WorkspaceTabs(props: WorkspaceTabsProps) {
  const { view, onView, adminUi, isAdmin, employeePreview, onTogglePreview, es } = props;
  const visible = TABS.filter((t) => adminUi || !t.adminOnly);
  return (
    <nav
      aria-label={es ? "Espacio de trabajo" : "Workspace"}
      className="flex flex-wrap items-center justify-between gap-3"
    >
      <Segmented
        role="page"
        label={es ? "Secciones" : "Sections"}
        value={view}
        onChange={onView}
        options={visible.map(({ id, icon, es: labelEs, en }) => ({
          id,
          icon,
          label: es ? labelEs : en,
        }))}
      />
      {isAdmin && (
        <button
          type="button"
          aria-pressed={employeePreview}
          onClick={onTogglePreview}
          className={cn(
            "press inline-flex min-h-9 items-center gap-1.5 rounded-full px-4 text-[13px] font-medium",
            employeePreview
              ? "bg-foreground text-background"
              : "glass text-muted-foreground hover:text-foreground",
          )}
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
