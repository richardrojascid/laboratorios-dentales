import { LoginForm } from "@/components/LoginForm";

export default function DoctorLoginPage() {
  return (
    <LoginForm
      role="DOCTOR"
      title="Acceso doctor"
      subtitle="Ingresa para registrar pacientes y enviar solicitudes de prótesis."
      successRedirect="/doctor/solicitudes"
    />
  );
}
