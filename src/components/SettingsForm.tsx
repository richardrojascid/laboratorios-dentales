"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";

export function SettingsForm() {
  const [companyName, setCompanyName] = useState("Laboratorio Art-Dental");
  const [logoPath, setLogoPath] = useState("/logo-art-dental.jpg");
  const [logo, setLogo] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data?.companyName) setCompanyName(data.companyName);
        if (data?.logoPath) setLogoPath(data.logoPath);
      })
      .catch(() => undefined);
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const form = new FormData();
    form.set("companyName", companyName);
    if (logo) form.set("logo", logo);

    const res = await fetch("/api/settings", {
      method: "PATCH",
      body: form,
    });

    setLoading(false);

    if (!res.ok) {
      setMessage("No se pudo guardar");
      return;
    }

    const data = await res.json();
    setLogoPath(data.logoPath);
    setMessage("Configuración actualizada");
    setLogo(null);
  }

  return (
    <form onSubmit={onSubmit} className="panel p-5 sm:p-6 max-w-xl animate-rise">
      <h2 className="text-2xl mb-1">Marca de la empresa</h2>
      <p className="text-sm text-[var(--muted)] mb-5">
        Cambia el nombre y el logo cuando tengas la identidad definitiva.
      </p>

      <div className="mb-5 flex items-center gap-4">
        <Image
          src={logoPath}
          alt={companyName}
          width={72}
          height={72}
          className="rounded-2xl border border-[var(--line)]"
          unoptimized
        />
        <div>
          <div className="display text-xl">{companyName}</div>
          <div className="text-xs text-[var(--muted)]">Vista previa</div>
        </div>
      </div>

      <div className="field">
        <label className="label">Nombre de la empresa</label>
        <input
          className="input"
          required
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
        />
      </div>

      <div className="field">
        <label className="label">Nuevo logo (PNG, SVG, JPG)</label>
        <input
          className="input"
          type="file"
          accept="image/*"
          onChange={(e) => setLogo(e.target.files?.[0] || null)}
        />
      </div>

      {message && <p className="text-sm text-[var(--success)] mb-3">{message}</p>}

      <button className="btn btn-primary" type="submit" disabled={loading}>
        {loading ? "Guardando..." : "Guardar marca"}
      </button>
    </form>
  );
}
