"use client";

import { FormEvent, useEffect, useState } from "react";

type FormField = {
  id: string;
  key: string;
  label: string;
  type: string;
  options: string | null;
  required: boolean;
  visibleDoctor: boolean;
  visibleOwner: boolean;
  editableOwner: boolean;
  sortOrder: number;
  active: boolean;
};

export function FieldsManager() {
  const [fields, setFields] = useState<FormField[]>([]);
  const [label, setLabel] = useState("");
  const [key, setKey] = useState("");
  const [type, setType] = useState("text");
  const [options, setOptions] = useState("");
  const [required, setRequired] = useState(false);
  const [visibleDoctor, setVisibleDoctor] = useState(true);
  const [visibleOwner, setVisibleOwner] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    const res = await fetch("/api/fields");
    const data = await res.json();
    setFields(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    load();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    const res = await fetch("/api/fields", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        key,
        label,
        type,
        options:
          type === "select"
            ? options
                .split(",")
                .map((o) => o.trim())
                .filter(Boolean)
            : undefined,
        required,
        visibleDoctor,
        visibleOwner,
        editableOwner: true,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "No se pudo crear el campo");
      return;
    }

    setMessage("Campo agregado");
    setLabel("");
    setKey("");
    setOptions("");
    setRequired(false);
    load();
  }

  async function patchField(id: string, data: Partial<FormField>) {
    await fetch(`/api/fields/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    load();
  }

  async function removeField(id: string) {
    const res = await fetch(`/api/fields/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "No se pudo eliminar");
      return;
    }
    load();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} className="panel p-5 sm:p-6 animate-rise">
        <h2 className="text-2xl mb-1">Mantenedor de campos</h2>
        <p className="text-sm text-[var(--muted)] mb-5">
          Agrega o quita campos visibles para doctores y para el laboratorio.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="field">
            <label className="label">Etiqueta</label>
            <input
              className="input"
              required
              value={label}
              onChange={(e) => {
                setLabel(e.target.value);
                if (!key) {
                  setKey(
                    e.target.value
                      .toLowerCase()
                      .normalize("NFD")
                      .replace(/[\u0300-\u036f]/g, "")
                      .replace(/[^a-z0-9]+/g, "_")
                      .replace(/^_|_$/g, "")
                  );
                }
              }}
            />
          </div>
          <div className="field">
            <label className="label">Clave técnica</label>
            <input
              className="input"
              required
              pattern="[a-zA-Z][a-zA-Z0-9_]*"
              value={key}
              onChange={(e) => setKey(e.target.value)}
            />
          </div>
          <div className="field">
            <label className="label">Tipo</label>
            <select className="select" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="text">Texto</option>
              <option value="textarea">Área de texto</option>
              <option value="date">Fecha</option>
              <option value="number">Número</option>
              <option value="select">Lista</option>
            </select>
          </div>
          {type === "select" && (
            <div className="field">
              <label className="label">Opciones (separadas por coma)</label>
              <input
                className="input"
                value={options}
                onChange={(e) => setOptions(e.target.value)}
                placeholder="Opción A, Opción B"
              />
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-4 mb-4 text-sm">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={required}
              onChange={(e) => setRequired(e.target.checked)}
            />
            Obligatorio
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={visibleDoctor}
              onChange={(e) => setVisibleDoctor(e.target.checked)}
            />
            Visible doctor
          </label>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={visibleOwner}
              onChange={(e) => setVisibleOwner(e.target.checked)}
            />
            Visible laboratorio
          </label>
        </div>
        {error && <p className="text-sm text-[var(--danger)] mb-3">{error}</p>}
        {message && <p className="text-sm text-[var(--success)] mb-3">{message}</p>}
        <button className="btn btn-primary" type="submit">
          Agregar campo
        </button>
      </form>

      <div className="panel p-5 animate-rise delay-1">
        <h3 className="text-xl mb-4">Campos actuales</h3>
        <div className="space-y-3">
          {fields.map((field) => (
            <div
              key={field.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-[var(--line)] rounded-xl p-3"
            >
              <div>
                <div className="font-semibold">
                  {field.label}{" "}
                  <span className="text-xs text-[var(--muted)]">({field.key})</span>
                </div>
                <div className="text-xs text-[var(--muted)] mt-1">
                  {field.type} · {field.active ? "Activo" : "Inactivo"} · Doctor:{" "}
                  {field.visibleDoctor ? "sí" : "no"} · Lab:{" "}
                  {field.visibleOwner ? "sí" : "no"}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() =>
                    patchField(field.id, { visibleDoctor: !field.visibleDoctor })
                  }
                >
                  {field.visibleDoctor ? "Ocultar doctor" : "Mostrar doctor"}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() =>
                    patchField(field.id, { visibleOwner: !field.visibleOwner })
                  }
                >
                  {field.visibleOwner ? "Ocultar lab" : "Mostrar lab"}
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => removeField(field.id)}
                >
                  Quitar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
