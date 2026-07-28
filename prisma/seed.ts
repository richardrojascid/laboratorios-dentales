import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PRICE_ITEMS = [
  {
    code: "MET-001",
    name: "Base metálica con acrílico",
    category: "Prótesis metálicas y flexibles",
    priceNeto: 115000,
    priceIva: 136850,
    sortOrder: 1,
  },
  {
    code: "MET-002",
    name: "Base metálica con flexible",
    category: "Prótesis metálicas y flexibles",
    priceNeto: 130000,
    priceIva: 154700,
    sortOrder: 2,
  },
  {
    code: "FLX-001",
    name: "Prótesis flexible total",
    category: "Prótesis metálicas y flexibles",
    priceNeto: 80000,
    priceIva: 95200,
    sortOrder: 3,
  },
  {
    code: "FLX-002",
    name: "Prótesis flexible parcial",
    category: "Prótesis metálicas y flexibles",
    priceNeto: 80000,
    priceIva: 95200,
    sortOrder: 4,
  },
  {
    code: "ACR-001",
    name: "Prótesis acrílica total o parcial un solo tono y gancho metálico",
    category: "Prótesis acrílicas",
    priceNeto: 65000,
    priceIva: 77350,
    sortOrder: 5,
  },
  {
    code: "ACR-002",
    name: "Prótesis total caracterizada con paladar transparente (Kit estético)",
    category: "Prótesis acrílicas",
    priceNeto: 80000,
    priceIva: 95200,
    sortOrder: 6,
  },
  {
    code: "ACR-003",
    name: "Prótesis total caracterizada con paladar transparente y malla (Kit estético)",
    category: "Prótesis acrílicas",
    priceNeto: 90000,
    priceIva: 107100,
    sortOrder: 7,
  },
  {
    code: "ACR-004",
    name: "Prótesis con ganchos transparentes",
    category: "Prótesis acrílicas",
    priceNeto: 70000,
    priceIva: 83300,
    sortOrder: 8,
  },
  {
    code: "COM-001",
    name: "Prótesis inmediata",
    category: "Trabajos complementarios",
    priceNeto: 50000,
    priceIva: 59500,
    sortOrder: 9,
  },
  {
    code: "COM-002",
    name: "Plano de relajación (acrílico termo)",
    category: "Trabajos complementarios",
    priceNeto: 55000,
    priceIva: 65450,
    sortOrder: 10,
  },
  {
    code: "COM-003",
    name: "Provisorios",
    category: "Trabajos complementarios",
    priceNeto: 25000,
    priceIva: 29750,
    sortOrder: 11,
  },
  {
    code: "COM-004",
    name: "Férula de acetato",
    category: "Trabajos complementarios",
    priceNeto: 20000,
    priceIva: 23800,
    sortOrder: 12,
  },
  {
    code: "COM-005",
    name: "Cubeta individual",
    category: "Trabajos complementarios",
    priceNeto: 6000,
    priceIva: 7140,
    sortOrder: 13,
  },
  {
    code: "COM-006",
    name: "Placa de altura",
    category: "Trabajos complementarios",
    priceNeto: 6000,
    priceIva: 7140,
    sortOrder: 14,
  },
  {
    code: "COM-007",
    name: "Vaciado o encofrado (yeso piedra)",
    category: "Trabajos complementarios",
    priceNeto: 4000,
    priceIva: null,
    sortOrder: 15,
  },
  {
    code: "COM-008",
    name: "Instalación de oro u otro metal",
    category: "Trabajos complementarios",
    priceNeto: 18000,
    priceIva: null,
    note: "El accesorio metálico debe ser entregado por el solicitante.",
    sortOrder: 16,
  },
];

async function main() {
  const ownerEmail = process.env.OWNER_EMAIL || "admin@artdental.cl";
  const ownerPassword = process.env.OWNER_PASSWORD || "Admin123!";

  const passwordHash = await bcrypt.hash(ownerPassword, 10);

  await prisma.user.upsert({
    where: { email: ownerEmail },
    update: {},
    create: {
      email: ownerEmail,
      passwordHash,
      name: "Orlando Fuenmayor",
      role: "OWNER",
    },
  });

  await prisma.appSettings.upsert({
    where: { id: "default" },
    update: {
      companyName: "Laboratorio Art-Dental",
      logoPath: "/logo-art-dental.jpg",
      tagline: "Devolvemos sonrisas",
    },
    create: {
      id: "default",
      companyName: "Laboratorio Art-Dental",
      logoPath: "/logo-art-dental.jpg",
      tagline: "Devolvemos sonrisas",
    },
  });

  for (const item of PRICE_ITEMS) {
    await prisma.priceItem.upsert({
      where: { code: item.code },
      update: {
        name: item.name,
        category: item.category,
        priceNeto: item.priceNeto,
        priceIva: item.priceIva,
        note: item.note || null,
        sortOrder: item.sortOrder,
        active: true,
      },
      create: {
        ...item,
        note: item.note || null,
      },
    });
  }

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
      label: "Descripción / notas del trabajo",
      type: "textarea",
      required: false,
      visibleDoctor: true,
      visibleOwner: true,
      editableOwner: true,
      sortOrder: 4,
    },
    {
      key: "notes",
      label: "Notas adicionales",
      type: "textarea",
      required: false,
      visibleDoctor: true,
      visibleOwner: true,
      editableOwner: true,
      sortOrder: 5,
    },
  ];

  for (const field of defaultFields) {
    await prisma.formField.upsert({
      where: { key: field.key },
      update: {},
      create: field,
    });
  }

  // Desactivar campos viejos de prótesis genérica (reemplazados por catálogo)
  await prisma.formField.updateMany({
    where: { key: { in: ["prosthesisType", "amount"] } },
    data: { active: false, visibleDoctor: false },
  });

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
          description: "Base metálica con acrílico",
          amount: 115000,
          workStatus: "EN_PROCESO",
          paymentStatus: "NO_PAGADO",
          lineItems: JSON.stringify([
            {
              code: "MET-001",
              name: "Base metálica con acrílico",
              price: 115000,
            },
          ]),
        },
        {
          doctorId: doctor.id,
          patientName: "Anays Yanez",
          receptionDate: new Date("2026-07-08"),
          deliveryDate: new Date("2026-07-08"),
          description: "Prótesis flexible total",
          amount: 80000,
          workStatus: "TERMINADO",
          paymentStatus: "PAGADO",
          lineItems: JSON.stringify([
            {
              code: "FLX-001",
              name: "Prótesis flexible total",
              price: 80000,
            },
          ]),
        },
        {
          doctorId: doctor.id,
          patientName: "Jorge Flores",
          deliveryDate: new Date("2026-07-15"),
          description: "Férula de acetato + cubeta individual",
          amount: 26000,
          workStatus: "POR_TOMAR",
          paymentStatus: "NO_PAGADO",
          lineItems: JSON.stringify([
            { code: "COM-004", name: "Férula de acetato", price: 20000 },
            { code: "COM-005", name: "Cubeta individual", price: 6000 },
          ]),
        },
      ],
    });
  }

  console.log("Seed completado — Laboratorio Art-Dental");
  console.log(`Dueño: ${ownerEmail} / ${ownerPassword}`);
  console.log("Doctor demo: dra.fernanda@gmail.com / Doctor123!");
  console.log(`Precios cargados: ${PRICE_ITEMS.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
