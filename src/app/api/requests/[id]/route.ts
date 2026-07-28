import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const request = await prisma.workRequest.findUnique({
    where: { id },
    include: {
      doctor: { select: { id: true, name: true, email: true, phone: true } },
    },
  });

  if (!request) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  if (
    session.user.role === "DOCTOR" &&
    request.doctorId !== session.user.id
  ) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  return NextResponse.json(request);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.workRequest.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  if (
    session.user.role === "DOCTOR" &&
    existing.doctorId !== session.user.id
  ) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    if (session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Solo el laboratorio puede subir comprobantes" }, { status: 403 });
    }

    const form = await req.formData();
    const file = form.get("receipt") as File | null;
    const workStatus = form.get("workStatus") as string | null;
    const paymentStatus = form.get("paymentStatus") as string | null;
    const amountRaw = form.get("amount") as string | null;
    const notes = form.get("notes") as string | null;
    const description = form.get("description") as string | null;
    const deliveryDate = form.get("deliveryDate") as string | null;
    const receptionDate = form.get("receptionDate") as string | null;
    const lineItemsRaw = form.get("lineItems") as string | null;

    let receiptPath = existing.receiptPath;

    if (file && file.size > 0) {
      const uploadsDir = path.join(process.cwd(), "public", "uploads", "receipts");
      await mkdir(uploadsDir, { recursive: true });
      const ext = path.extname(file.name) || ".bin";
      const filename = `${id}-${Date.now()}${ext}`;
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(path.join(uploadsDir, filename), buffer);
      receiptPath = `/uploads/receipts/${filename}`;
    }

    const updated = await prisma.workRequest.update({
      where: { id },
      data: {
        workStatus: workStatus || existing.workStatus,
        paymentStatus: paymentStatus || existing.paymentStatus,
        amount:
          amountRaw !== null && amountRaw !== ""
            ? Number(amountRaw)
            : existing.amount,
        notes: notes !== null ? notes : existing.notes,
        description: description || existing.description,
        deliveryDate: deliveryDate
          ? new Date(deliveryDate)
          : existing.deliveryDate,
        receptionDate: receptionDate
          ? new Date(receptionDate)
          : existing.receptionDate,
        lineItems: lineItemsRaw || existing.lineItems,
        receiptPath,
      },
      include: {
        doctor: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(updated);
  }

  const body = await req.json();

  if (session.user.role === "OWNER") {
    const updated = await prisma.workRequest.update({
      where: { id },
      data: {
        workStatus: body.workStatus ?? existing.workStatus,
        paymentStatus: body.paymentStatus ?? existing.paymentStatus,
        amount:
          body.amount !== undefined ? Number(body.amount) : existing.amount,
        notes: body.notes !== undefined ? body.notes : existing.notes,
        description: body.description ?? existing.description,
        deliveryDate: body.deliveryDate
          ? new Date(body.deliveryDate)
          : existing.deliveryDate,
        receptionDate: body.receptionDate
          ? new Date(body.receptionDate)
          : existing.receptionDate,
        customFields:
          body.customFields !== undefined
            ? JSON.stringify(body.customFields)
            : existing.customFields,
        lineItems:
          body.lineItems !== undefined
            ? JSON.stringify(body.lineItems)
            : existing.lineItems,
      },
      include: {
        doctor: { select: { id: true, name: true, email: true } },
      },
    });
    return NextResponse.json(updated);
  }

  // Doctor: limited updates
  const updated = await prisma.workRequest.update({
    where: { id },
    data: {
      patientName: body.patientName ?? existing.patientName,
      description: body.description ?? existing.description,
      notes: body.notes !== undefined ? body.notes : existing.notes,
      deliveryDate: body.deliveryDate
        ? new Date(body.deliveryDate)
        : existing.deliveryDate,
      receptionDate: body.receptionDate
        ? new Date(body.receptionDate)
        : existing.receptionDate,
      customFields:
        body.customFields !== undefined
          ? JSON.stringify(body.customFields)
          : existing.customFields,
    },
    include: {
      doctor: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json(updated);
}
