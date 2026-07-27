import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  const doctor = await prisma.user.findFirst({
    where: { id, role: "DOCTOR" },
  });
  if (!doctor) {
    return NextResponse.json({ error: "Doctor no encontrado" }, { status: 404 });
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      active: typeof body.active === "boolean" ? body.active : doctor.active,
      name: body.name ?? doctor.name,
      phone: body.phone !== undefined ? body.phone : doctor.phone,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      active: true,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const doctor = await prisma.user.findFirst({
    where: { id, role: "DOCTOR" },
  });
  if (!doctor) {
    return NextResponse.json({ error: "Doctor no encontrado" }, { status: 404 });
  }

  await prisma.user.update({
    where: { id },
    data: { active: false },
  });

  return NextResponse.json({ ok: true });
}
