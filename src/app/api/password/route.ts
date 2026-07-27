import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/mail";

const requestSchema = z.object({
  email: z.string().email(),
});

const resetSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  const body = await req.json();
  const action = body.action || "request";

  if (action === "request") {
    try {
      const { email } = requestSchema.parse(body);
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
      });

      // Always return ok to avoid email enumeration
      if (!user || !user.active) {
        return NextResponse.json({
          ok: true,
          message: "Si el correo existe, recibirás un enlace de recuperación.",
        });
      }

      await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await prisma.passwordResetToken.create({
        data: { token, userId: user.id, expiresAt },
      });

      const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
      const resetUrl = `${baseUrl}/recuperar?token=${token}`;

      const result = await sendPasswordResetEmail(user.email, resetUrl, user.name);

      return NextResponse.json({
        ok: true,
        message: "Si el correo existe, recibirás un enlace de recuperación.",
        ...(result.mocked ? { previewUrl: result.preview } : {}),
      });
    } catch {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }
  }

  if (action === "reset") {
    try {
      const { token, password } = resetSchema.parse(body);
      const record = await prisma.passwordResetToken.findUnique({
        where: { token },
      });

      if (!record || record.expiresAt < new Date()) {
        return NextResponse.json(
          { error: "El enlace es inválido o ha expirado" },
          { status: 400 }
        );
      }

      const passwordHash = await bcrypt.hash(password, 10);
      await prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      });
      await prisma.passwordResetToken.delete({ where: { id: record.id } });

      return NextResponse.json({ ok: true, message: "Contraseña actualizada" });
    } catch {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    }
  }

  return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ authenticated: false });
  }
  return NextResponse.json({ authenticated: true, user: session.user });
}
