import { requireDoctor } from "@/lib/session";
import { AppHeader } from "@/components/AppHeader";

const items = [
  { href: "/doctor/solicitudes", label: "Mis solicitudes" },
  { href: "/doctor/nueva", label: "Nueva solicitud" },
];

export default async function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireDoctor();

  return (
    <div className="min-h-dvh pb-10">
      <AppHeader
        items={items}
        userName={session.user.name}
        homeHref="/doctor/solicitudes"
      />
      <main className="shell pt-5">{children}</main>
    </div>
  );
}
