import "@/lib/env";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const items = await prisma.priceItem.findMany({
      where: { active: true },
      orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error("[prices GET]", error);
    return NextResponse.json([], { status: 200 });
  }
}

const createSchema = z.object({
  code: z.string().min(2),
  name: z.string().min(2),
  category: z.string().min(2),
  priceNeto: z.number().nonnegative(),
  priceIva: z.number().nonnegative().nullable().optional(),
  note: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = createSchema.parse(await req.json());
    const exists = await prisma.priceItem.findUnique({ where: { code: body.code } });
    if (exists) {
      return NextResponse.json({ error: "Ya existe ese código" }, { status: 400 });
    }
    const max = await prisma.priceItem.aggregate({ _max: { sortOrder: true } });
    const item = await prisma.priceItem.create({
      data: {
        ...body,
        sortOrder: (max._max.sortOrder || 0) + 1,
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }
    return NextResponse.json({ error: "No se pudo crear" }, { status: 500 });
  }
}
