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

  const existing = await prisma.formField.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Campo no encontrado" }, { status: 404 });
  }

  const reserved = ["patientName", "description", "amount"];
  if (reserved.includes(existing.key) && body.active === false) {
    return NextResponse.json(
      { error: "No se puede desactivar un campo esencial" },
      { status: 400 }
    );
  }

  const updated = await prisma.formField.update({
    where: { id },
    data: {
      label: body.label ?? existing.label,
      type: body.type ?? existing.type,
      options:
        body.options !== undefined
          ? JSON.stringify(body.options)
          : existing.options,
      required: body.required ?? existing.required,
      visibleDoctor: body.visibleDoctor ?? existing.visibleDoctor,
      visibleOwner: body.visibleOwner ?? existing.visibleOwner,
      editableOwner: body.editableOwner ?? existing.editableOwner,
      sortOrder: body.sortOrder ?? existing.sortOrder,
      active: body.active ?? existing.active,
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
  const existing = await prisma.formField.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Campo no encontrado" }, { status: 404 });
  }

  const reserved = ["patientName", "description", "amount"];
  if (reserved.includes(existing.key)) {
    return NextResponse.json(
      { error: "No se puede eliminar un campo esencial" },
      { status: 400 }
    );
  }

  await prisma.formField.update({
    where: { id },
    data: { active: false },
  });

  return NextResponse.json({ ok: true });
}
