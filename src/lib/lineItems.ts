import { prisma } from "@/lib/prisma";

export type LineItem = {
  code: string;
  name: string;
  price: number;
};

function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function parseLineItems(raw?: string | null): LineItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((l) => l && l.code && l.name);
  } catch {
    return [];
  }
}

export async function ensureLineItems(request: {
  id: string;
  description: string;
  amount: number | null;
  lineItems: string;
}): Promise<LineItem[]> {
  const existing = parseLineItems(request.lineItems);
  if (existing.length > 0) return existing;

  const prices = await prisma.priceItem.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });

  const desc = request.description || "";
  const normDesc = normalize(desc);

  const matched = prices.filter((p) => {
    const n = normalize(p.name);
    return (
      (n && normDesc.includes(n)) ||
      (normDesc && n.includes(normDesc)) ||
      desc.includes(p.code)
    );
  });

  const lines: LineItem[] =
    matched.length > 0
      ? matched.map((p) => ({
          code: p.code,
          name: p.name,
          price: p.priceNeto,
        }))
      : [
          {
            code: "OTR-001",
            name: desc || "Trabajo sin catálogo",
            price: request.amount || 0,
          },
        ];

  // Persist so next reads already have codes
  await prisma.workRequest.update({
    where: { id: request.id },
    data: {
      lineItems: JSON.stringify(lines),
      description: lines.map((l) => `${l.code} ${l.name}`).join(" · "),
    },
  });

  return lines;
}
