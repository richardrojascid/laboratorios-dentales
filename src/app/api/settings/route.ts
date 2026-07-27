import "@/lib/env";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { defaultSettings } from "@/lib/env";

export async function GET() {
  try {
    const settings = await prisma.appSettings.findUnique({
      where: { id: "default" },
    });
    return NextResponse.json(settings || defaultSettings);
  } catch (error) {
    console.error("[settings GET]", error);
    // Nunca romper login/registro por settings
    return NextResponse.json(defaultSettings);
  }
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const companyName = form.get("companyName") as string | null;
      const logo = form.get("logo") as File | null;

      const current = await prisma.appSettings.findUnique({
        where: { id: "default" },
      });

      let logoPath = current?.logoPath || "/logo.svg";

      if (logo && logo.size > 0) {
        const uploadsDir = path.join(process.cwd(), "public", "uploads");
        await mkdir(uploadsDir, { recursive: true });
        const ext = path.extname(logo.name) || ".png";
        const filename = `logo-${Date.now()}${ext}`;
        const buffer = Buffer.from(await logo.arrayBuffer());
        await writeFile(path.join(uploadsDir, filename), buffer);
        logoPath = `/uploads/${filename}`;
      }

      const updated = await prisma.appSettings.upsert({
        where: { id: "default" },
        update: {
          companyName: companyName || current?.companyName || "ArcadaLab",
          logoPath,
        },
        create: {
          id: "default",
          companyName: companyName || "ArcadaLab",
          logoPath,
        },
      });

      return NextResponse.json(updated);
    }

    const body = await req.json();
    const updated = await prisma.appSettings.upsert({
      where: { id: "default" },
      update: {
        companyName: body.companyName,
        logoPath: body.logoPath,
      },
      create: {
        id: "default",
        companyName: body.companyName || "ArcadaLab",
        logoPath: body.logoPath || "/logo.svg",
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[settings PATCH]", error);
    return NextResponse.json(
      {
        error:
          "No se pudo guardar. Ejecuta npm run db:setup y reinicia npm run dev",
      },
      { status: 500 }
    );
  }
}
