"use client";

import { FormEvent, useEffect, useState } from "react";

type Doctor = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  active: boolean;
  createdAt: string;
  _count?: { requests: number };
};

export function DoctorsManager() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    const res = await fetch("/api/doctors");
    const data = await res.json();
    setDoctors(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    load();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const res = await fetch("/api/doctors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, phone }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "No se pudo enrolar al doctor");
      return;
    }

    setMessage("Doctor enrolado correctamente");
    setName("");
    setEmail("");
    setPassword("");
    setPhone("");
    load();
  }

  async function toggleActive(doctor: Doctor) {
    await fetch(`/api/doctors/${doctor.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !doctor.active }),
    });
    load();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} className="panel p-5 sm:p-6 animate-rise">
        <h2 className="text-2xl mb-1">Enrolar doctor (opcional)</h2>
        <p className="text-sm text-[var(--muted)] mb-5">
          Los doctores también pueden registrarse solos. Usa esto solo si quieres
          crearles una cuenta temporal.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="field">
            <label className="label">Nombre completo</label>
            <input
              className="input"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Dra. Fernanda..."
            />
          </div>
          <div className="field">
            <label className="label">Correo Gmail</label>
            <input
              className="input"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="doctor@gmail.com"
            />
          </div>
          <div className="field">
            <label className="label">Contraseña temporal</label>
            <input
              className="input"
              type="text"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="field">
            <label className="label">Teléfono (opcional)</label>
            <input
              className="input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </div>
        {error && <p className="text-sm text-[var(--danger)] mb-3">{error}</p>}
        {message && <p className="text-sm text-[var(--success)] mb-3">{message}</p>}
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Guardando..." : "Enrolar doctor"}
        </button>
      </form>

      <div className="panel p-5 animate-rise delay-1">
        <h3 className="text-xl mb-4">Doctores enrolados</h3>
        {doctors.length === 0 ? (
          <p className="empty">Aún no hay doctores.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Solicitudes</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {doctors.map((d) => (
                  <tr key={d.id}>
                    <td>{d.name}</td>
                    <td>{d.email}</td>
                    <td>{d._count?.requests ?? 0}</td>
                    <td>
                      <span className={`badge ${d.active ? "status-done" : "status-unpaid"}`}>
                        {d.active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => toggleActive(d)}
                      >
                        {d.active ? "Desactivar" : "Activar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
