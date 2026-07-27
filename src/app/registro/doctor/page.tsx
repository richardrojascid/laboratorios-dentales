import { RegisterForm } from "@/components/RegisterForm";

export default function DoctorRegisterPage() {
  return (
    <RegisterForm
      role="DOCTOR"
      title="Registro doctor"
      subtitle="Crea tu cuenta para enviar solicitudes de prótesis al laboratorio."
      loginHref="/login/doctor"
      successRedirect="/doctor/solicitudes"
    />
  );
}
