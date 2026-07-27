import "@/lib/env";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().min(2, "Nombre muy corto"),
  email: z.string().email("Correo inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  phone: z.string().optional(),
  role: z.enum(["OWNER", "DOCTOR"]),
  companyName: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        {
          error:
            "Falta configuración de base de datos. Ejecuta: npm run db:setup",
        },
        { status: 500 }
      );
    }

    const body = await req.json();
    const data = schema.parse(body);
    const email = data.email.toLowerCase().trim();

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json(
        { error: "Ya existe una cuenta con ese correo" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        name: data.name.trim(),
        email,
        passwordHash,
        phone: data.phone?.trim() || null,
        role: data.role,
        active: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (data.role === "OWNER" && data.companyName?.trim()) {
      await prisma.appSettings.upsert({
        where: { id: "default" },
        update: { companyName: data.companyName.trim() },
        create: {
          id: "default",
          companyName: data.companyName.trim(),
          logoPath: "/logo.svg",
        },
      });
    }

    return NextResponse.json(
      {
        ok: true,
        user,
        message:
          data.role === "OWNER"
            ? "Cuenta de laboratorio creada. Ya puedes iniciar sesión."
            : "Cuenta de doctor creada. Ya puedes iniciar sesión.",
      },
      { status: 201 }
    );
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: e.errors[0]?.message || "Datos inválidos" },
        { status: 400 }
      );
    }

    const message = e instanceof Error ? e.message : "";
    if (
      message.includes("DATABASE_URL") ||
      message.includes("Environment variable")
    ) {
      return NextResponse.json(
        {
          error:
            "Falta el archivo .env. Ejecuta en la carpeta del proyecto: npm run db:setup",
        },
        { status: 500 }
      );
    }

    console.error(e);
    return NextResponse.json(
      { error: "No se pudo completar el registro" },
      { status: 500 }
    );
  }
}
