"use client";

import { FormEvent, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { BrandMark } from "./BrandMark";

export function RecoverPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function requestReset(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    setPreviewUrl("");

    const res = await fetch("/api/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "request", email }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "No se pudo enviar el correo");
      return;
    }

    setMessage(data.message);
    if (data.previewUrl) setPreviewUrl(data.previewUrl);
  }

  async function resetPassword(e: FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    const res = await fetch("/api/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reset", token, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "No se pudo restablecer");
      return;
    }

    setMessage("Contraseña actualizada. Ya puedes iniciar sesión.");
    setTimeout(() => router.push("/"), 1500);
  }

  return (
    <div className="shell hero-home">
      <div className="max-w-md mx-auto w-full animate-rise">
        <div className="mb-8 flex justify-center">
          <BrandMark size={56} />
        </div>
        <div className="panel p-6 sm:p-8">
          <h1 className="text-3xl mb-2">
            {token ? "Nueva contraseña" : "Recuperar acceso"}
          </h1>
          <p className="text-[var(--muted)] mb-6">
            {token
              ? "Define una nueva contraseña para tu cuenta."
              : "Te enviaremos un enlace a tu correo Gmail."}
          </p>

          {token ? (
            <form onSubmit={resetPassword} className="space-y-4">
              <div className="field">
                <label className="label">Nueva contraseña</label>
                <input
                  className="input"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="field">
                <label className="label">Confirmar</label>
                <input
                  className="input"
                  type="password"
                  required
                  minLength={6}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
              {message && <p className="text-sm text-[var(--success)]">{message}</p>}
              <button className="btn btn-primary w-full" disabled={loading} type="submit">
                {loading ? "Guardando..." : "Restablecer"}
              </button>
            </form>
          ) : (
            <form onSubmit={requestReset} className="space-y-4">
              <div className="field">
                <label className="label">Correo Gmail</label>
                <input
                  className="input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
              {message && <p className="text-sm text-[var(--success)]">{message}</p>}
              {previewUrl && (
                <p className="text-xs text-[var(--muted)] break-all">
                  Modo desarrollo (sin Gmail SMTP):{" "}
                  <a href={previewUrl} className="text-[var(--brand)] font-semibold">
                    abrir enlace
                  </a>
                </p>
              )}
              <button className="btn btn-primary w-full" disabled={loading} type="submit">
                {loading ? "Enviando..." : "Enviar enlace"}
              </button>
            </form>
          )}

          <Link href="/" className="inline-block mt-4 text-sm text-[var(--muted)]">
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
