import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const settings = await prisma.appSettings.findUnique({
    where: { id: "default" },
  }).catch(() => null);

  const companyName = settings?.companyName || "ArcadaLab";
  const logoPath = settings?.logoPath || "/logo.svg";

  return (
    <main className="hero-home">
      <div className="shell">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-center">
          <section className="animate-rise">
            <div className="inline-flex items-center gap-3 mb-6">
              <Image
                src={logoPath}
                alt={companyName}
                width={64}
                height={64}
                className="rounded-2xl animate-float"
                unoptimized
                priority
              />
            </div>
            <h1 className="hero-brand">{companyName}</h1>
            <p className="hero-copy">
              Plataforma web para que tus doctores envíen solicitudes de prótesis
              dentales y tu laboratorio controle estados, montos y pagos desde el celular.
            </p>
            <div className="role-choice">
              <div className="role-card animate-rise delay-1">
                <div className="text-xs uppercase tracking-wide text-[var(--accent)] font-bold mb-2">
                  Laboratorio
                </div>
                <h2 className="text-2xl m-0 mb-2">Dueño / laboratorio</h2>
                <p className="text-sm text-[var(--muted)] mb-4">
                  Gestiona solicitudes, montos, estados, doctores y estadísticas.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link href="/login/dueno" className="btn btn-primary">
                    Ingresar
                  </Link>
                  <Link href="/registro/dueno" className="btn btn-secondary">
                    Registrarme
                  </Link>
                </div>
              </div>
              <div className="role-card animate-rise delay-2">
                <div className="text-xs uppercase tracking-wide text-[var(--accent-warm)] font-bold mb-2">
                  Clínica
                </div>
                <h2 className="text-2xl m-0 mb-2">Doctor</h2>
                <p className="text-sm text-[var(--muted)] mb-4">
                  Crea tu cuenta y envía solicitudes de prótesis al laboratorio.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Link href="/login/doctor" className="btn btn-primary">
                    Ingresar
                  </Link>
                  <Link href="/registro/doctor" className="btn btn-secondary">
                    Registrarme
                  </Link>
                </div>
              </div>
            </div>
          </section>

          <aside className="panel p-6 sm:p-8 animate-rise delay-3 relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-40"
              style={{
                background:
                  "radial-gradient(circle at 80% 20%, rgba(21,152,149,.35), transparent 45%), radial-gradient(circle at 10% 90%, rgba(244,162,97,.28), transparent 40%)",
              }}
            />
            <div className="relative">
              <p className="text-sm font-semibold text-[var(--brand)] mb-3">Flujo de trabajo</p>
              <ol className="space-y-4 m-0 pl-5 text-[var(--ink)]">
                <li>El laboratorio y los doctores se registran con su correo y clave.</li>
                <li>El doctor crea la solicitud del paciente desde el formulario.</li>
                <li>El laboratorio asigna monto, estado y comprobante de pago.</li>
                <li>Las estadísticas resumen ventas por día, semana, mes y año.</li>
              </ol>
              <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-[var(--brand-soft)] px-4 py-2 text-sm font-semibold text-[var(--brand)] animate-glow">
                Responsive para celular y escritorio
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
