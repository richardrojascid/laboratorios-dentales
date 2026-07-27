import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const settings = await prisma.appSettings.findUnique({
    where: { id: "default" },
  });
  return NextResponse.json(
    settings || { companyName: "ArcadaLab", logoPath: "/logo.svg" }
  );
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

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
}
