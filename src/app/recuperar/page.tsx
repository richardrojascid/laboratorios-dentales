import { Suspense } from "react";
import { RecoverPasswordForm } from "@/components/RecoverPasswordForm";

export default function RecoverPage() {
  return (
    <Suspense fallback={<div className="shell hero-home">Cargando...</div>}>
      <RecoverPasswordForm />
    </Suspense>
  );
}
