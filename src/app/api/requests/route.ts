import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const lineItemSchema = z.object({
  code: z.string(),
  name: z.string(),
  price: z.number(),
});

const createSchema = z.object({
  patientName: z.string().min(1),
  receptionDate: z.string().optional().nullable(),
  deliveryDate: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  customFields: z.record(z.string(), z.unknown()).optional(),
  lineItems: z.array(lineItemSchema).min(1, "Selecciona al menos un trabajo"),
  amount: z.number().optional().nullable(),
});

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const workStatus = searchParams.get("workStatus");
  const paymentStatus = searchParams.get("paymentStatus");
  const doctorId = searchParams.get("doctorId");

  const where: Record<string, unknown> = {};

  if (session.user.role === "DOCTOR") {
    where.doctorId = session.user.id;
  } else if (doctorId) {
    where.doctorId = doctorId;
  }

  if (workStatus) where.workStatus = workStatus;
  if (paymentStatus) where.paymentStatus = paymentStatus;

  const requests = await prisma.workRequest.findMany({
    where,
    include: {
      doctor: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const { ensureLineItems, parseLineItems } = await import("@/lib/lineItems");

  const enriched = await Promise.all(
    requests.map(async (request) => {
      const lines = parseLineItems(request.lineItems);
      if (lines.length > 0) return request;
      const ensured = await ensureLineItems(request);
      return { ...request, lineItems: JSON.stringify(ensured) };
    })
  );

  return NextResponse.json(enriched);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "DOCTOR") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = createSchema.parse(body);
    const lineItems = data.lineItems;
    const amount =
      data.amount != null
        ? data.amount
        : lineItems.reduce((sum, item) => sum + item.price, 0);
    const description =
      (data.description || "").trim() ||
      lineItems.map((l) => `${l.code} ${l.name}`).join(" · ");

    const request = await prisma.workRequest.create({
      data: {
        doctorId: session.user.id,
        patientName: data.patientName,
        receptionDate: data.receptionDate
          ? new Date(data.receptionDate)
          : null,
        deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : null,
        description,
        notes: data.notes || null,
        customFields: JSON.stringify(data.customFields || {}),
        lineItems: JSON.stringify(lineItems),
        amount: amount || null,
      },
      include: {
        doctor: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(request, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Debes seleccionar trabajos del catálogo", details: e.issues },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Error al crear solicitud" }, { status: 500 });
  }
}
