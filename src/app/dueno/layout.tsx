import { requireOwner } from "@/lib/session";
import { AppHeader } from "@/components/AppHeader";

const items = [
  { href: "/dueno/solicitudes", label: "Solicitudes" },
  { href: "/dueno/doctores", label: "Doctores" },
  { href: "/dueno/campos", label: "Campos" },
  { href: "/dueno/estadisticas", label: "Estadísticas" },
  { href: "/dueno/configuracion", label: "Marca" },
];

export default async function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireOwner();

  return (
    <div className="min-h-dvh pb-10">
      <AppHeader
        items={items}
        userName={session.user.name}
        homeHref="/dueno/solicitudes"
      />
      <main className="shell pt-5">{children}</main>
    </div>
  );
}
