"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BrandMark } from "./BrandMark";

export function RegisterForm({
  role,
  title,
  subtitle,
  loginHref,
  successRedirect,
}: {
  role: "OWNER" | "DOCTOR";
  title: string;
  subtitle: string;
  loginHref: string;
  successRedirect: string;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        password,
        phone: phone || undefined,
        role,
        companyName: role === "OWNER" ? companyName || undefined : undefined,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setLoading(false);
      setError(data.error || "No se pudo registrar");
      return;
    }

    const login = await signIn("credentials", {
      email,
      password,
      role,
      redirect: false,
    });

    setLoading(false);

    if (login?.error) {
      router.push(loginHref);
      return;
    }

    router.push(successRedirect);
    router.refresh();
  }

  return (
    <div className="shell hero-home">
      <div className="max-w-md mx-auto w-full animate-rise">
        <div className="mb-8 flex justify-center">
          <BrandMark size={96} />
        </div>
        <div className="panel p-6 sm:p-8">
          <h1 className="text-3xl mb-2">{title}</h1>
          <p className="text-[var(--muted)] mb-6">{subtitle}</p>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="field">
              <label className="label" htmlFor="name">
                Nombre completo
              </label>
              <input
                id="name"
                className="input"
                required
                minLength={2}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={
                  role === "OWNER" ? "Nombre del responsable" : "Dr(a). Nombre"
                }
              />
            </div>

            {role === "OWNER" && (
              <div className="field">
                <label className="label" htmlFor="companyName">
                  Nombre del laboratorio (opcional)
                </label>
                <input
                  id="companyName"
                  className="input"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Ej: Laboratorio Art-Dental"
                />
              </div>
            )}

            <div className="field">
              <label className="label" htmlFor="email">
                Correo Gmail / email
              </label>
              <input
                id="email"
                className="input"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@gmail.com"
              />
            </div>

            <div className="field">
              <label className="label" htmlFor="phone">
                Teléfono (opcional)
              </label>
              <input
                id="phone"
                className="input"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+56 9 ..."
              />
            </div>

            <div className="field">
              <label className="label" htmlFor="password">
                Contraseña
              </label>
              <input
                id="password"
                className="input"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="field">
              <label className="label" htmlFor="confirm">
                Confirmar contraseña
              </label>
              <input
                id="confirm"
                className="input"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>

            {error && (
              <p className="text-sm text-[var(--danger)]" role="alert">
                {error}
              </p>
            )}

            <button className="btn btn-primary w-full" disabled={loading} type="submit">
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </button>
          </form>

          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <Link href={loginHref} className="text-[var(--brand)] font-semibold">
              Ya tengo cuenta — Ingresar
            </Link>
            <Link href="/" className="text-[var(--muted)]">
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
