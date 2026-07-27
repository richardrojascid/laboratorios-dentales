"use client";

import { useEffect, useState } from "react";
import {
  formatCLP,
  formatDate,
  PAYMENT_STATUS_COLORS,
  PAYMENT_STATUS_LABELS,
  WORK_STATUS_COLORS,
  WORK_STATUS_LABELS,
} from "@/lib/format";

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
  createdAt: string;
  doctor: { id: string; name: string; email: string };
};

export function RequestsBoard({ mode }: { mode: "owner" | "doctor" }) {
  const [items, setItems] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<RequestItem | null>(null);
  const [workFilter, setWorkFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [saving, setSaving] = useState(false);
  const [amount, setAmount] = useState("");
  const [workStatus, setWorkStatus] = useState("POR_TOMAR");
  const [paymentStatus, setPaymentStatus] = useState("NO_PAGADO");
  const [notes, setNotes] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (workFilter) params.set("workStatus", workFilter);
    if (paymentFilter) params.set("paymentStatus", paymentFilter);
    const res = await fetch(`/api/requests?${params.toString()}`);
    const data = await res.json();
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workFilter, paymentFilter]);

  function openDetail(item: RequestItem) {
    setSelected(item);
    setAmount(item.amount != null ? String(item.amount) : "");
    setWorkStatus(item.workStatus);
    setPaymentStatus(item.paymentStatus);
    setNotes(item.notes || "");
    setReceipt(null);
    setMessage("");
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

  const custom =
    selected?.customFields
      ? (JSON.parse(selected.customFields) as Record<string, string>)
      : {};

  return (
    <div className="space-y-4">
      <div className="panel p-4 mobile-stack row animate-rise">
        <div>
          <h2 className="text-2xl mb-1">
            {mode === "owner" ? "Solicitudes de trabajo" : "Mis solicitudes"}
          </h2>
          <p className="text-sm text-[var(--muted)]">
            {mode === "owner"
              ? "Revisa trabajos, montos, estados y comprobantes."
              : "Seguimiento de las solicitudes enviadas al laboratorio."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            className="select"
            style={{ width: "auto" }}
            value={workFilter}
            onChange={(e) => setWorkFilter(e.target.value)}
          >
            <option value="">Todo trabajo</option>
            <option value="POR_TOMAR">Por tomar</option>
            <option value="EN_PROCESO">En proceso</option>
            <option value="TERMINADO">Terminado</option>
          </select>
          <select
            className="select"
            style={{ width: "auto" }}
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
          >
            <option value="">Todo pago</option>
            <option value="PAGADO">Pagado</option>
            <option value="NO_PAGADO">No pagado</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="panel empty">Cargando solicitudes...</div>
      ) : items.length === 0 ? (
        <div className="panel empty">No hay solicitudes todavía.</div>
      ) : (
        <div className="request-grid">
          {items.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              className={`panel p-4 text-left animate-rise delay-${(idx % 3) + 1}`}
              onClick={() => openDetail(item)}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <h3 className="text-lg font-semibold m-0">{item.patientName}</h3>
                  {mode === "owner" && (
                    <p className="text-sm text-[var(--muted)] m-0 mt-1">
                      Dr(a). {item.doctor.name}
                    </p>
                  )}
                </div>
                <span className="text-sm font-semibold text-[var(--brand)]">
                  {formatCLP(item.amount)}
                </span>
              </div>
              <p className="text-sm mb-3 line-clamp-2">{item.description}</p>
              <div className="flex flex-wrap gap-2 mb-2">
                <span className={`badge ${WORK_STATUS_COLORS[item.workStatus]}`}>
                  {WORK_STATUS_LABELS[item.workStatus]}
                </span>
                <span className={`badge ${PAYMENT_STATUS_COLORS[item.paymentStatus]}`}>
                  {PAYMENT_STATUS_LABELS[item.paymentStatus]}
                </span>
              </div>
              <p className="text-xs text-[var(--muted)] m-0">
                Entrega: {formatDate(item.deliveryDate)} · Creada: {formatDate(item.createdAt)}
              </p>
            </button>
          ))}
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
              <button className="btn btn-ghost" type="button" onClick={() => setSelected(null)}>
                Cerrar
              </button>
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
                <p className="m-0 mt-1 whitespace-pre-wrap">{selected.description}</p>
              </div>
              {Object.entries(custom).map(([k, v]) => (
                <div key={k}>
                  <strong>{k}:</strong> {String(v)}
                </div>
              ))}
            </div>

            {mode === "owner" ? (
              <div className="space-y-3 border-t border-[var(--line)] pt-4">
                <div className="field">
                  <label className="label">Monto (CLP)</label>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Ej: 45000"
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
                      <option value="POR_TOMAR">Por tomar</option>
                      <option value="EN_PROCESO">En proceso</option>
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
                {message && <p className="text-sm text-[var(--success)]">{message}</p>}
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
                <div className="flex flex-wrap gap-2">
                  <span className={`badge ${WORK_STATUS_COLORS[selected.workStatus]}`}>
                    {WORK_STATUS_LABELS[selected.workStatus]}
                  </span>
                  <span className={`badge ${PAYMENT_STATUS_COLORS[selected.paymentStatus]}`}>
                    {PAYMENT_STATUS_LABELS[selected.paymentStatus]}
                  </span>
                </div>
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
