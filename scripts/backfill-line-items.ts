import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

async function main() {
  const prices = await prisma.priceItem.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });

  const requests = await prisma.workRequest.findMany();
  let updated = 0;
  let otherIndex = 1;

  for (const request of requests) {
    let lines: { code: string; name: string; price: number }[] = [];
    try {
      const parsed = JSON.parse(request.lineItems || "[]");
      if (Array.isArray(parsed)) lines = parsed;
    } catch {
      lines = [];
    }

    const valid = lines.filter((l) => l?.code && l?.name);
    if (valid.length > 0) continue;

    const desc = request.description || "";
    const normDesc = normalize(desc);
    const matched = prices.filter((p) => {
      const n = normalize(p.name);
      return normDesc.includes(n) || n.includes(normDesc) || desc.includes(p.code);
    });

    if (matched.length > 0) {
      lines = matched.map((p) => ({
        code: p.code,
        name: p.name,
        price: p.priceNeto,
      }));
    } else {
      // Partir por separadores comunes si vienen varios trabajos en texto libre
      const parts = desc
        .split(/\s*[·|;,]\s*|\s+y\s+/i)
        .map((p) => p.trim())
        .filter((p) => p.length > 2);

      if (parts.length > 1) {
        lines = parts.map((part) => {
          const hit = prices.find((p) => {
            const n = normalize(p.name);
            const np = normalize(part);
            return np.includes(n) || n.includes(np) || part.includes(p.code);
          });
          if (hit) {
            return { code: hit.code, name: hit.name, price: hit.priceNeto };
          }
          const code = `OTR-${String(otherIndex++).padStart(3, "0")}`;
          return {
            code,
            name: part,
            price: 0,
          };
        });
      } else {
        const code = `OTR-${String(otherIndex++).padStart(3, "0")}`;
        lines = [
          {
            code,
            name: desc || "Trabajo sin catálogo",
            price: request.amount || 0,
          },
        ];
      }
    }

    const amount =
      request.amount != null && request.amount > 0
        ? request.amount
        : lines.reduce((s, l) => s + (l.price || 0), 0);

    await prisma.workRequest.update({
      where: { id: request.id },
      data: {
        lineItems: JSON.stringify(lines),
        amount,
        description: lines.map((l) => `${l.code} ${l.name}`).join(" · "),
      },
    });
    updated += 1;
  }

  console.log(`Backfill listo. Solicitudes actualizadas: ${updated}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
