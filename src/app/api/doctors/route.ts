import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const doctors = await prisma.user.findMany({
    where: { role: "DOCTOR" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      active: true,
      createdAt: true,
      _count: { select: { requests: true } },
    },
  });

  return NextResponse.json(doctors);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = schema.parse(body);
    const email = data.email.toLowerCase().trim();

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json(
        { error: "Ya existe un usuario con ese correo" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const doctor = await prisma.user.create({
      data: {
        name: data.name,
        email,
        passwordHash,
        phone: data.phone || null,
        role: "DOCTOR",
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        active: true,
        createdAt: true,
      },
    });

    return NextResponse.json(doctor, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }
    return NextResponse.json({ error: "Error al crear doctor" }, { status: 500 });
  }
}
