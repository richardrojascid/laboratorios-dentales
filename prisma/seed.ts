import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const ownerEmail = process.env.OWNER_EMAIL || "admin@arcadalab.cl";
  const ownerPassword = process.env.OWNER_PASSWORD || "Admin123!";

  const passwordHash = await bcrypt.hash(ownerPassword, 10);

  await prisma.user.upsert({
    where: { email: ownerEmail },
    update: {},
    create: {
      email: ownerEmail,
      passwordHash,
      name: "Administrador ArcadaLab",
      role: "OWNER",
    },
  });

  await prisma.appSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      companyName: "ArcadaLab",
      logoPath: "/logo.svg",
    },
  });

  const defaultFields = [
    {
      key: "patientName",
      label: "Nombre de paciente",
      type: "text",
      required: true,
      visibleDoctor: true,
      visibleOwner: true,
      editableOwner: false,
      sortOrder: 1,
    },
    {
      key: "receptionDate",
      label: "Fecha de recepción",
      type: "date",
      required: false,
      visibleDoctor: true,
      visibleOwner: true,
      editableOwner: true,
      sortOrder: 2,
    },
    {
      key: "deliveryDate",
      label: "Fecha de entrega",
      type: "date",
      required: false,
      visibleDoctor: true,
      visibleOwner: true,
      editableOwner: true,
      sortOrder: 3,
    },
    {
      key: "description",
      label: "Descripción del trabajo",
      type: "textarea",
      required: true,
      visibleDoctor: true,
      visibleOwner: true,
      editableOwner: true,
      sortOrder: 4,
    },
    {
      key: "prosthesisType",
      label: "Tipo de prótesis",
      type: "select",
      options: JSON.stringify([
        "Prótesis total",
        "Prótesis parcial",
        "Flexible",
        "Férula",
        "Cubeta individual",
        "Rodete",
        "Enfilado",
        "Terminación",
        "Prótesis de cicatrización",
        "Otro",
      ]),
      required: false,
      visibleDoctor: true,
      visibleOwner: true,
      editableOwner: true,
      sortOrder: 5,
    },
    {
      key: "amount",
      label: "Monto",
      type: "number",
      required: false,
      visibleDoctor: false,
      visibleOwner: true,
      editableOwner: true,
      sortOrder: 6,
    },
    {
      key: "notes",
      label: "Notas adicionales",
      type: "textarea",
      required: false,
      visibleDoctor: true,
      visibleOwner: true,
      editableOwner: true,
      sortOrder: 7,
    },
  ];

  for (const field of defaultFields) {
    await prisma.formField.upsert({
      where: { key: field.key },
      update: {},
      create: field,
    });
  }

  const doctorPassword = await bcrypt.hash("Doctor123!", 10);
  const doctor = await prisma.user.upsert({
    where: { email: "dra.fernanda@gmail.com" },
    update: {},
    create: {
      email: "dra.fernanda@gmail.com",
      passwordHash: doctorPassword,
      name: "Dra. Fernanda López",
      role: "DOCTOR",
      phone: "+56 9 1234 5678",
    },
  });

  const existingRequests = await prisma.workRequest.count({
    where: { doctorId: doctor.id },
  });

  if (existingRequests === 0) {
    await prisma.workRequest.createMany({
      data: [
        {
          doctorId: doctor.id,
          patientName: "Emilio Donoso",
          receptionDate: new Date("2026-07-20"),
          deliveryDate: new Date("2026-07-24"),
          description: "Rodete inferior",
          amount: 40000,
          workStatus: "EN_PROCESO",
          paymentStatus: "NO_PAGADO",
          customFields: JSON.stringify({ prosthesisType: "Rodete" }),
        },
        {
          doctorId: doctor.id,
          patientName: "Anays Yanez",
          receptionDate: new Date("2026-07-08"),
          deliveryDate: new Date("2026-07-08"),
          description: "Enfilado superior flexible",
          amount: 70000,
          workStatus: "TERMINADO",
          paymentStatus: "PAGADO",
          customFields: JSON.stringify({ prosthesisType: "Enfilado" }),
        },
        {
          doctorId: doctor.id,
          patientName: "Jorge Flores",
          deliveryDate: new Date("2026-07-15"),
          description: "Férulas superior 1.5 e inferior",
          amount: 45000,
          workStatus: "POR_TOMAR",
          paymentStatus: "NO_PAGADO",
          customFields: JSON.stringify({ prosthesisType: "Férula" }),
        },
      ],
    });
  }

  console.log("Seed completado.");
  console.log(`Dueño: ${ownerEmail} / ${ownerPassword}`);
  console.log("Doctor demo: dra.fernanda@gmail.com / Doctor123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
