export function formatCLP(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-CL");
}

export const WORK_STATUS_LABELS: Record<string, string> = {
  POR_TOMAR: "Solicitado",
  EN_PROCESO: "Trabajo iniciado",
  TERMINADO: "Terminado",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PAGADO: "Pagado",
  NO_PAGADO: "No pagado",
};

export const WORK_STATUS_COLORS: Record<string, string> = {
  POR_TOMAR: "status-pending",
  EN_PROCESO: "status-progress",
  TERMINADO: "status-done",
};

export const PAYMENT_STATUS_COLORS: Record<string, string> = {
  PAGADO: "status-paid",
  NO_PAGADO: "status-unpaid",
};
