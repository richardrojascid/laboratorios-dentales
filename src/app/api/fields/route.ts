import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const audience = searchParams.get("audience"); // doctor | owner

  const where: { active?: boolean } = { active: true };

  const fields = await prisma.formField.findMany({
    where: session.user.role === "OWNER" && audience !== "doctor" && audience !== "owner"
      ? {}
      : where,
    orderBy: { sortOrder: "asc" },
  });

  let filtered = fields;
  if (audience === "doctor" || session.user.role === "DOCTOR") {
    filtered = fields.filter((f) => f.visibleDoctor && f.active);
  } else if (audience === "owner") {
    filtered = fields.filter((f) => f.visibleOwner && f.active);
  }

  return NextResponse.json(filtered);
}

const fieldSchema = z.object({
  key: z.string().min(1).regex(/^[a-zA-Z][a-zA-Z0-9_]*$/),
  label: z.string().min(1),
  type: z.enum(["text", "textarea", "date", "number", "select"]),
  options: z.array(z.string()).optional(),
  required: z.boolean().optional(),
  visibleDoctor: z.boolean().optional(),
  visibleOwner: z.boolean().optional(),
  editableOwner: z.boolean().optional(),
  sortOrder: z.number().optional(),
  active: z.boolean().optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = fieldSchema.parse(body);

    const exists = await prisma.formField.findUnique({ where: { key: data.key } });
    if (exists) {
      return NextResponse.json({ error: "Ya existe un campo con esa clave" }, { status: 400 });
    }

    const maxOrder = await prisma.formField.aggregate({ _max: { sortOrder: true } });

    const field = await prisma.formField.create({
      data: {
        key: data.key,
        label: data.label,
        type: data.type,
        options: data.options ? JSON.stringify(data.options) : null,
        required: data.required ?? false,
        visibleDoctor: data.visibleDoctor ?? true,
        visibleOwner: data.visibleOwner ?? true,
        editableOwner: data.editableOwner ?? true,
        sortOrder: data.sortOrder ?? (maxOrder._max.sortOrder || 0) + 1,
        active: data.active ?? true,
      },
    });

    return NextResponse.json(field, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos", details: e.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Error al crear campo" }, { status: 500 });
  }
}
