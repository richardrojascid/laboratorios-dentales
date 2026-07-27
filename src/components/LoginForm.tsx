"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BrandMark } from "./BrandMark";

export function LoginForm({
  role,
  title,
  subtitle,
  successRedirect,
}: {
  role: "OWNER" | "DOCTOR";
  title: string;
  subtitle: string;
  successRedirect: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      role,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Correo o contraseña incorrectos");
      return;
    }

    router.push(successRedirect);
    router.refresh();
  }

  return (
    <div className="shell hero-home">
      <div className="max-w-md mx-auto w-full animate-rise">
        <div className="mb-8 flex justify-center">
          <BrandMark size={56} />
        </div>
        <div className="panel p-6 sm:p-8">
          <h1 className="text-3xl mb-2">{title}</h1>
          <p className="text-[var(--muted)] mb-6">{subtitle}</p>
          <form onSubmit={onSubmit} className="space-y-4">
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
              <label className="label" htmlFor="password">
                Contraseña
              </label>
              <input
                id="password"
                className="input"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && (
              <p className="text-sm text-[var(--danger)]" role="alert">
                {error}
              </p>
            )}
            <button className="btn btn-primary w-full" disabled={loading} type="submit">
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>
          <div className="mt-5 space-y-3 text-sm">
            <p className="m-0">
              ¿No tienes cuenta?{" "}
              <Link
                href={role === "OWNER" ? "/registro/dueno" : "/registro/doctor"}
                className="text-[var(--brand)] font-semibold"
              >
                Regístrate aquí
              </Link>
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/recuperar" className="text-[var(--brand)] font-semibold">
                Recuperar contraseña
              </Link>
              <Link href="/" className="text-[var(--muted)]">
                Volver al inicio
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
