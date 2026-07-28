"use client";

import { useEffect, useMemo, useState } from "react";
import {
  formatCLP,
  formatDate,
  WORK_STATUS_LABELS,
} from "@/lib/format";
import {
  PriceItemPicker,
  SelectedLine,
} from "@/components/PriceItemPicker";

type RequestItem = {
  id: string;
  patientName: string;
  receptionDate: string | null;
  deliveryDate: string | null;
  description: string;
  amount: number | null;
  workStatus: string;
  paymentStatus: string;
  receiptPath: string | null;
  notes: string | null;
  customFields: string;
  lineItems?: string;
  createdAt: string;
  doctor: { id: string; name: string; email: string };
};

const WORK_COLUMNS = [
  { key: "POR_TOMAR", title: "Solicitado" },
  { key: "EN_PROCESO", title: "Trabajo iniciado" },
  { key: "TERMINADO", title: "Terminado" },
] as const;

function parseLines(raw?: string | null): SelectedLine[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function PaymentBadge({ status }: { status: string }) {
  const paid = status === "PAGADO";
  return (
    <span className={`pay-badge ${paid ? "pay-paid" : "pay-unpaid"}`}>
      {paid ? "Pagado" : "No pagado"}
    </span>
  );
}

export function RequestsBoard({ mode }: { mode: "owner" | "doctor" }) {
  const [items, setItems] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<RequestItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [amount, setAmount] = useState("");
  const [workStatus, setWorkStatus] = useState("POR_TOMAR");
  const [paymentStatus, setPaymentStatus] = useState("NO_PAGADO");
  const [notes, setNotes] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [lineItems, setLineItems] = useState<SelectedLine[]>([]);
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/requests`);
    const data = await res.json();
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const byStatus = useMemo(() => {
    const map: Record<string, RequestItem[]> = {
      POR_TOMAR: [],
      EN_PROCESO: [],
      TERMINADO: [],
    };
    for (const item of items) {
      (map[item.workStatus] || map.POR_TOMAR).push(item);
    }
    return map;
  }, [items]);

  const paidItems = useMemo(
    () => items.filter((i) => i.paymentStatus === "PAGADO"),
    [items]
  );

  function openDetail(item: RequestItem) {
    setSelected(item);
    setAmount(item.amount != null ? String(item.amount) : "");
    setWorkStatus(item.workStatus);
    setPaymentStatus(item.paymentStatus);
    setNotes(item.notes || "");
    setLineItems(parseLines(item.lineItems));
    setReceipt(null);
    setMessage("");
  }

  async function quickUpdate(
    id: string,
    patch: { workStatus?: string; paymentStatus?: string }
  ) {
    if (mode !== "owner") return;
    const res = await fetch(`/api/requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) load();
  }

  async function saveOwner() {
    if (!selected) return;
    setSaving(true);
    setMessage("");

    const form = new FormData();
    form.set("amount", amount);
    form.set("workStatus", workStatus);
    form.set("paymentStatus", paymentStatus);
    form.set("notes", notes);
    form.set("lineItems", JSON.stringify(lineItems));
    if (receipt) form.set("receipt", receipt);

    const res = await fetch(`/api/requests/${selected.id}`, {
      method: "PATCH",
      body: form,
    });

    setSaving(false);

    if (!res.ok) {
      setMessage("No se pudo guardar");
      return;
    }

    const updated = await res.json();
    setSelected(updated);
    setMessage("Guardado correctamente");
    load();
  }

  function RequestCard({ item }: { item: RequestItem }) {
    const lines = parseLines(item.lineItems);
    return (
      <div
        className="kanban-card text-left"
        role="button"
        tabIndex={0}
        onClick={() => openDetail(item)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openDetail(item);
          }
        }}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-base font-semibold m-0">{item.patientName}</h3>
          <PaymentBadge status={item.paymentStatus} />
        </div>
        {mode === "owner" && (
          <p className="text-xs text-[var(--muted)] m-0 mb-2">
            Dr(a). {item.doctor.name}
          </p>
        )}
        <div className="space-y-1 mb-3 min-w-0">
          {lines.length > 0 ? (
            lines.map((line) => (
              <div key={line.code} className="line-chip" title={`${line.code} ${line.name}`}>
                <span className="price-code">{line.code}</span>
                <span className="line-chip-name">{line.name}</span>
              </div>
            ))
          ) : (
            <p className="text-sm m-0 line-clamp-2 break-words">{item.description}</p>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="font-semibold text-[var(--brand)]">
            {formatCLP(item.amount)}
          </span>
          <span className="text-[var(--muted)]">
            Entrega {formatDate(item.deliveryDate)}
          </span>
        </div>
        {mode === "owner" && (
          <div
            className="mt-3 flex flex-wrap gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            {item.workStatus !== "POR_TOMAR" && (
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: "0.35rem 0.55rem", fontSize: "0.75rem" }}
                onClick={() =>
                  quickUpdate(item.id, { workStatus: "POR_TOMAR" })
                }
              >
                Solicitado
              </button>
            )}
            {item.workStatus !== "EN_PROCESO" && (
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: "0.35rem 0.55rem", fontSize: "0.75rem" }}
                onClick={() =>
                  quickUpdate(item.id, { workStatus: "EN_PROCESO" })
                }
              >
                Iniciar
              </button>
            )}
            {item.workStatus !== "TERMINADO" && (
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: "0.35rem 0.55rem", fontSize: "0.75rem" }}
                onClick={() =>
                  quickUpdate(item.id, { workStatus: "TERMINADO" })
                }
              >
                Terminar
              </button>
            )}
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: "0.35rem 0.55rem", fontSize: "0.75rem" }}
              onClick={() =>
                quickUpdate(item.id, {
                  paymentStatus:
                    item.paymentStatus === "PAGADO" ? "NO_PAGADO" : "PAGADO",
                })
              }
            >
              {item.paymentStatus === "PAGADO" ? "Marcar no pagado" : "Marcar pagado"}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="panel p-4 animate-rise">
        <h2 className="text-2xl mb-1">
          {mode === "owner" ? "Solicitudes de trabajo" : "Mis solicitudes"}
        </h2>
        <p className="text-sm text-[var(--muted)] m-0">
          Tablero por estado: Solicitado, Trabajo iniciado, Terminado y Pagado.
        </p>
      </div>

      {loading ? (
        <div className="panel empty">Cargando solicitudes...</div>
      ) : (
        <div className="kanban-board animate-rise delay-1">
          {WORK_COLUMNS.map((col) => (
            <section key={col.key} className="kanban-column">
              <header className="kanban-column-header">
                <h3>{col.title}</h3>
                <span>{byStatus[col.key]?.length || 0}</span>
              </header>
              <div className="kanban-column-body">
                {(byStatus[col.key] || []).map((item) => (
                  <RequestCard key={item.id} item={item} />
                ))}
                {(byStatus[col.key] || []).length === 0 && (
                  <p className="empty text-sm">Sin solicitudes</p>
                )}
              </div>
            </section>
          ))}

          <section className="kanban-column kanban-paid">
            <header className="kanban-column-header">
              <h3>Pagado</h3>
              <span>{paidItems.length}</span>
            </header>
            <div className="kanban-column-body">
              {paidItems.map((item) => (
                <RequestCard key={`paid-${item.id}`} item={item} />
              ))}
              {paidItems.length === 0 && (
                <p className="empty text-sm">Sin pagos registrados</p>
              )}
            </div>
          </section>
        </div>
      )}

      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/40 p-3 sm:p-6 overflow-y-auto"
          onClick={() => setSelected(null)}
        >
          <div
            className="panel max-w-2xl mx-auto p-5 sm:p-6 my-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="text-2xl m-0">{selected.patientName}</h3>
                <p className="text-sm text-[var(--muted)] m-0 mt-1">
                  Doctor: {selected.doctor.name} ({selected.doctor.email})
                </p>
              </div>
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => setSelected(null)}
              >
                Cerrar
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <span className="badge status-progress">
                {WORK_STATUS_LABELS[selected.workStatus]}
              </span>
              <PaymentBadge status={selected.paymentStatus} />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 mb-4 text-sm">
              <div>
                <strong>Recepción:</strong> {formatDate(selected.receptionDate)}
              </div>
              <div>
                <strong>Entrega:</strong> {formatDate(selected.deliveryDate)}
              </div>
              <div className="sm:col-span-2">
                <strong>Descripción:</strong>
                <p className="m-0 mt-1 whitespace-pre-wrap">
                  {selected.description}
                </p>
              </div>
              <div className="sm:col-span-2">
                <strong>Ítems:</strong>
                <div className="mt-2 space-y-1">
                  {parseLines(selected.lineItems).map((line) => (
                    <div key={line.code} className="line-chip detail">
                      <span className="price-code">{line.code}</span>
                      <span className="line-chip-name">{line.name}</span>
                      <span className="font-semibold whitespace-nowrap">
                        {formatCLP(line.price)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {mode === "owner" ? (
              <div className="space-y-3 border-t border-[var(--line)] pt-4">
                <PriceItemPicker
                  value={lineItems}
                  onChange={(items, total) => {
                    setLineItems(items);
                    setAmount(String(total));
                  }}
                />
                <div className="field">
                  <label className="label">Monto (CLP)</label>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="field">
                    <label className="label">Estado de trabajo</label>
                    <select
                      className="select"
                      value={workStatus}
                      onChange={(e) => setWorkStatus(e.target.value)}
                    >
                      <option value="POR_TOMAR">Solicitado</option>
                      <option value="EN_PROCESO">Trabajo iniciado</option>
                      <option value="TERMINADO">Terminado</option>
                    </select>
                  </div>
                  <div className="field">
                    <label className="label">Estado de pago</label>
                    <select
                      className="select"
                      value={paymentStatus}
                      onChange={(e) => setPaymentStatus(e.target.value)}
                    >
                      <option value="NO_PAGADO">No pagado</option>
                      <option value="PAGADO">Pagado</option>
                    </select>
                  </div>
                </div>
                <div className="field">
                  <label className="label">Notas del laboratorio</label>
                  <textarea
                    className="textarea"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label className="label">Comprobante de pago</label>
                  <input
                    className="input"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setReceipt(e.target.files?.[0] || null)}
                  />
                  {selected.receiptPath && (
                    <a
                      href={selected.receiptPath}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-[var(--brand)] font-semibold mt-2 inline-block"
                    >
                      Ver comprobante actual
                    </a>
                  )}
                </div>
                {message && (
                  <p className="text-sm text-[var(--success)]">{message}</p>
                )}
                <button
                  className="btn btn-primary"
                  type="button"
                  disabled={saving}
                  onClick={saveOwner}
                >
                  {saving ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            ) : (
              <div className="border-t border-[var(--line)] pt-4 space-y-2">
                <p>
                  <strong>Monto:</strong> {formatCLP(selected.amount)}
                </p>
                {selected.notes && (
                  <p>
                    <strong>Notas lab:</strong> {selected.notes}
                  </p>
                )}
                {selected.receiptPath && (
                  <a
                    href={selected.receiptPath}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--brand)] font-semibold"
                  >
                    Ver comprobante
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
