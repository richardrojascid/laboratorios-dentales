import { LoginForm } from "@/components/LoginForm";

export default function OwnerLoginPage() {
  return (
    <LoginForm
      role="OWNER"
      title="Acceso laboratorio"
      subtitle="Ingresa con tu cuenta de dueño para gestionar solicitudes y doctores."
      successRedirect="/dueno/solicitudes"
    />
  );
}
