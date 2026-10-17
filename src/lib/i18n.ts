import type { Category, LogKey, RuleId, Status } from "./agent";

export type Lang = "es" | "en";
const usd = (n: number) => "$" + n.toLocaleString("en-US");

const dict = {
  es: {
    tagline: "Agente de gobernanza para cuentas por pagar",
    loginTitle: "Bienvenido a WinkWink",
    loginSub: "Pagos automáticos con límites estrictos. Elige un rol para la demo.",
    asEmployee: "Entrar como Empleado",
    asEmployeeSub: "Ver bandeja y estado de facturas enviadas",
    asAdmin: "Entrar como Administrador Financiero",
    asAdminSub: "Configurar reglas y aprobar excepciones",
    inbox: "Bandeja",
    approved: "Aprobadas",
    attention: "Requiere Atención",
    settings: "Configuración",
    employee: "Empleado",
    admin: "Admin Financiero",
    logout: "Cerrar Sesión",
    rulesTitle: "Reglas Activas del Agente",
    rulesSub: "El agente solo paga lo que cumple estas políticas.",
    inboxTitle: "Cuentas por Pagar",
    empty: "No hay facturas en esta vista.",
    selectHint: "Selecciona una factura para evaluarla.",
    run: "Ejecutar Agente WinkWink",
    running: "Evaluando…",
    rerun: "Reiniciar evaluación",
    steps: [
      "Leyendo metadatos del PDF...",
      "Verificando cuenta bancaria registrada...",
      "Verificando facturas duplicadas...",
      "Evaluando límites de política...",
    ],
    approve: "Aprobar Excepción",
    reject: "Rechazar",
    adminOnly: "Solo un Administrador Financiero puede resolver esta factura.",
    vendor: "Proveedor",
    category: "Categoría",
    amount: "Monto",
    date: "Fecha",
    submittedBy: "Enviado por",
    auditLog: "Registro de auditoría inmutable",
    decisionPanel: "Evaluación IA",
    unknownVendor: "Proveedor desconocido",
    restricted: "Acceso restringido. Las reglas solo son visibles para administradores.",
    toastPaid: "Pago ejecutado por IA",
    toastReview: "Pago detenido — requiere revisión",
    toastOverride: "Excepción aprobada",
    toastRejected: "Factura rechazada",
  },
  en: {
    tagline: "Governance agent for accounts payable",
    loginTitle: "Welcome to WinkWink",
    loginSub: "Automatic payments with strict boundaries. Pick a role for the demo.",
    asEmployee: "Log in as Employee",
    asEmployeeSub: "View inbox and status of submitted invoices",
    asAdmin: "Log in as Finance Admin",
    asAdminSub: "Configure rules and approve overrides",
    inbox: "Inbox",
    approved: "Approved",
    attention: "Requires Attention",
    settings: "Settings",
    employee: "Employee",
    admin: "Finance Admin",
    logout: "Log Out",
    rulesTitle: "Active Agent Rules",
    rulesSub: "The agent only pays what complies with these policies.",
    inboxTitle: "Invoice Inbox",
    empty: "No invoices in this view.",
    selectHint: "Select an invoice to evaluate it.",
    run: "Run WinkWink AI Agent",
    running: "Evaluating…",
    rerun: "Reset evaluation",
    steps: [
      "Reading invoice metadata & OCR...",
      "Cross-checking bank account against verified vendor DB...",
      "Scanning for duplicate invoice IDs...",
      "Evaluating company policy limits...",
    ],
    approve: "Approve Override",
    reject: "Reject",
    adminOnly: "Only a Finance Admin can resolve this invoice.",
    vendor: "Vendor",
    category: "Category",
    amount: "Amount",
    date: "Date",
    submittedBy: "Submitted by",
    auditLog: "Immutable audit log",
    decisionPanel: "AI Evaluation",
    unknownVendor: "Unknown vendor",
    restricted: "Restricted access. Rules are visible to admins only.",
    toastPaid: "Payment executed by AI",
    toastReview: "Payment halted — review required",
    toastOverride: "Override approved",
    toastRejected: "Invoice rejected",
  },
};

export const t = (lang: Lang) => dict[lang];

export const categoryLabel = (lang: Lang, c: Category) =>
  ({
    es: { software: "Software/SaaS", travel: "Viáticos", marketing: "Marketing" },
    en: { software: "Software/SaaS", travel: "Travel", marketing: "Marketing" },
  })[lang][c];

export const statusLabel = (lang: Lang, s: Status) =>
  ({
    es: {
      pending: "Pendiente",
      paid: "Aprobada por IA",
      review: "Requiere Revisión Humana",
      override: "Aprobado por Excepción",
      rejected: "Rechazado",
      security: "BLOQUEADO POR ALERTA DE SEGURIDAD",
    },
    en: {
      pending: "Pending",
      paid: "Approved by AI",
      review: "Requires Human Review",
      override: "Override Approved",
      rejected: "Rejected",
      security: "BLOCKED — POSSIBLY ADULTERATED",
    },
  })[lang][s];

export const ruleLabel = (lang: Lang, r: RuleId) =>
  ({
    es: {
      saas: "Auto-aprobar facturas de Software/SaaS menores a $500",
      travel: "Marcar facturas de Viáticos mayores a $100 para revisión humana",
      unknown: "Marcar cualquier factura de un Proveedor Desconocido",
    },
    en: {
      saas: "Auto-approve Software/SaaS invoices under $500",
      travel: "Flag Travel invoices over $100 for human review",
      unknown: "Flag any invoice from an Unknown Vendor",
    },
  })[lang][r];

export function logText(lang: Lang, l: LogKey): string {
  const es = lang === "es";
  switch (l.key) {
    case "security":
      return es
        ? `ALERTA DE SEGURIDAD: cuenta ${l.bank} diferente de ${l.registered}. Aprobación bloqueada. No se ejecutó ningún pago.`
        : `SECURITY ALERT: account ${l.bank} differs from ${l.registered}. Approval blocked. No payment was executed.`;
    case "approvedSaas":
      return es
        ? `Log: Aprobado automáticamente. La categoría es Software y el monto (${usd(l.amount)}) es menor al umbral de $500.`
        : `Log: Approved automatically. Category is Software and amount (${usd(l.amount)}) is under the $500 threshold.`;
    case "haltTravel":
      return es
        ? `Log: Pago detenido. El monto (${usd(l.amount)}) excede el límite de $100 para Viáticos.`
        : `Log: Payment halted. Amount (${usd(l.amount)}) exceeds the $100 limit for Travel category.`;
    case "haltUnknown":
      return es
        ? `Log: Pago detenido. "${l.vendor}" no está en la lista de proveedores verificados.`
        : `Log: Payment halted. "${l.vendor}" is not on the verified vendor list.`;
    case "haltNoRule":
      return es
        ? `Log: Pago detenido. Ninguna regla activa autoriza el pago automático de ${usd(l.amount)}.`
        : `Log: Payment halted. No active rule authorizes automatic payment of ${usd(l.amount)}.`;
    case "override":
      return es
        ? "Log: Excepción aprobada manualmente por Administrador Financiero."
        : "Log: Override manually approved by Finance Admin.";
    case "rejected":
      return es
        ? "Log: Factura rechazada por Administrador Financiero."
        : "Log: Invoice rejected by Finance Admin.";
  }
}

export { usd };
