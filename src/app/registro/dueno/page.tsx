import { RegisterForm } from "@/components/RegisterForm";

export default function OwnerRegisterPage() {
  return (
    <RegisterForm
      role="OWNER"
      title="Registro laboratorio"
      subtitle="Crea tu cuenta de dueño para gestionar solicitudes, doctores y pagos."
      loginHref="/login/dueno"
      successRedirect="/dueno/solicitudes"
    />
  );
}
