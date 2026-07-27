"use client";

import { useRouter } from "next/navigation";
import { PatientRequestForm } from "@/components/PatientRequestForm";

export default function DoctorNewRequestPage() {
  const router = useRouter();

  return (
    <PatientRequestForm
      onCreated={() => {
        setTimeout(() => router.push("/doctor/solicitudes"), 800);
      }}
    />
  );
}
