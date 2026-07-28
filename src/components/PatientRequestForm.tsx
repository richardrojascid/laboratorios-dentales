"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  PriceItemPicker,
  SelectedLine,
} from "@/components/PriceItemPicker";

type FormField = {
  id: string;
  key: string;
  label: string;
  type: string;
  options: string | null;
  required: boolean;
};

const CORE_KEYS = new Set([
  "patientName",
  "receptionDate",
  "deliveryDate",
  "description",
  "notes",
  "amount",
  "prosthesisType",
]);

export function PatientRequestForm({ onCreated }: { onCreated?: () => void }) {
  const [fields, setFields] = useState<FormField[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [lineItems, setLineItems] = useState<SelectedLine[]>([]);
  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/fields?audience=doctor")
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data)
          ? data.filter(
              (f: FormField) => f.key !== "amount" && f.key !== "prosthesisType"
            )
          : [];
        setFields(list);
      })
      .catch(() => setError("No se pudieron cargar los campos"));
  }, []);

  function setValue(key: string, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    if (lineItems.length === 0) {
      setLoading(false);
      setError("Selecciona al menos un trabajo de la lista de precios");
      return;
    }

    const customFields: Record<string, string> = {};
    for (const field of fields) {
      if (!CORE_KEYS.has(field.key) && values[field.key]) {
        customFields[field.key] = values[field.key];
      }
    }

    const description =
      values.description?.trim() ||
      lineItems.map((l) => `${l.code} ${l.name}`).join(" · ");

    const payload = {
      patientName: values.patientName || "",
      receptionDate: values.receptionDate || null,
      deliveryDate: values.deliveryDate || null,
      description,
      notes: values.notes || null,
      customFields,
      lineItems,
      amount,
    };

    const res = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "No se pudo crear la solicitud");
      return;
    }

    setMessage("Solicitud enviada correctamente");
    setValues({});
    setLineItems([]);
    setAmount(0);
    onCreated?.();
  }

  function renderField(field: FormField) {
    const value = values[field.key] || "";
    const options = field.options ? (JSON.parse(field.options) as string[]) : [];

    if (field.type === "textarea") {
      return (
        <textarea
          className="textarea"
          required={field.required}
          value={value}
          onChange={(e) => setValue(field.key, e.target.value)}
          placeholder={field.label}
        />
      );
    }

    if (field.type === "select") {
      return (
        <select
          className="select"
          required={field.required}
          value={value}
          onChange={(e) => setValue(field.key, e.target.value)}
        >
          <option value="">Seleccionar...</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    }

    return (
      <input
        className="input"
        type={
          field.type === "number"
            ? "number"
            : field.type === "date"
              ? "date"
              : "text"
        }
        required={field.required}
        value={value}
        onChange={(e) => setValue(field.key, e.target.value)}
        placeholder={field.label}
      />
    );
  }

  return (
    <form onSubmit={onSubmit} className="panel p-5 sm:p-6 animate-rise">
      <h2 className="text-2xl mb-1">Nueva solicitud de paciente</h2>
      <p className="text-[var(--muted)] mb-5 text-sm">
        Completa los datos y selecciona los trabajos desde la lista de precios.
      </p>

      {fields.map((field) => (
        <div className="field" key={field.id}>
          <label className="label">
            {field.label}
            {field.required ? " *" : ""}
          </label>
          {renderField(field)}
        </div>
      ))}

      <div className="field">
        <PriceItemPicker
          value={lineItems}
          onChange={(items, total) => {
            setLineItems(items);
            setAmount(total);
          }}
        />
      </div>

      {error && <p className="text-sm text-[var(--danger)] mb-3">{error}</p>}
      {message && <p className="text-sm text-[var(--success)] mb-3">{message}</p>}

      <button className="btn btn-primary" type="submit" disabled={loading}>
        {loading ? "Enviando..." : "Enviar solicitud"}
      </button>
    </form>
  );
}
