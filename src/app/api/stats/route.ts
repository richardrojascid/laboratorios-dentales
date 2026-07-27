import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  format,
} from "date-fns";
import { es } from "date-fns/locale";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") || "month"; // day | week | month | year
  const now = new Date();

  let from: Date;
  let to: Date;

  switch (period) {
    case "day":
      from = startOfDay(now);
      to = endOfDay(now);
      break;
    case "week":
      from = startOfWeek(now, { weekStartsOn: 1 });
      to = endOfWeek(now, { weekStartsOn: 1 });
      break;
    case "year":
      from = startOfYear(now);
      to = endOfYear(now);
      break;
    case "month":
    default:
      from = startOfMonth(now);
      to = endOfMonth(now);
      break;
  }

  const requests = await prisma.workRequest.findMany({
    where: {
      createdAt: { gte: from, lte: to },
      amount: { not: null },
    },
    include: {
      doctor: { select: { name: true } },
    },
  });

  const totalSales = requests.reduce((sum, r) => sum + (r.amount || 0), 0);
  const paidSales = requests
    .filter((r) => r.paymentStatus === "PAGADO")
    .reduce((sum, r) => sum + (r.amount || 0), 0);
  const unpaidSales = totalSales - paidSales;

  const byWorkStatus = ["POR_TOMAR", "EN_PROCESO", "TERMINADO"].map((status) => ({
    name:
      status === "POR_TOMAR"
        ? "Por tomar"
        : status === "EN_PROCESO"
          ? "En proceso"
          : "Terminado",
    value: requests.filter((r) => r.workStatus === status).length,
    key: status,
  }));

  const byPayment = [
    {
      name: "Pagado",
      value: requests.filter((r) => r.paymentStatus === "PAGADO").length,
      amount: paidSales,
    },
    {
      name: "No pagado",
      value: requests.filter((r) => r.paymentStatus === "NO_PAGADO").length,
      amount: unpaidSales,
    },
  ];

  const byDoctorMap = new Map<string, number>();
  for (const r of requests) {
    const name = r.doctor.name;
    byDoctorMap.set(name, (byDoctorMap.get(name) || 0) + (r.amount || 0));
  }
  const byDoctor = Array.from(byDoctorMap.entries()).map(([name, value]) => ({
    name,
    value,
  }));

  // Timeline buckets for sales
  let timeline: { name: string; value: number }[] = [];

  if (period === "day") {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    timeline = hours.map((h) => {
      const value = requests
        .filter((r) => r.createdAt.getHours() === h)
        .reduce((s, r) => s + (r.amount || 0), 0);
      return { name: `${h}:00`, value };
    }).filter((t) => t.value > 0);
    if (timeline.length === 0) {
      timeline = [{ name: format(now, "dd/MM"), value: totalSales }];
    }
  } else if (period === "week") {
    const days = eachDayOfInterval({ start: from, end: to });
    timeline = days.map((d) => {
      const value = requests
        .filter(
          (r) =>
            r.createdAt >= startOfDay(d) && r.createdAt <= endOfDay(d)
        )
        .reduce((s, r) => s + (r.amount || 0), 0);
      return { name: format(d, "EEE", { locale: es }), value };
    });
  } else if (period === "year") {
    const months = eachMonthOfInterval({ start: from, end: to });
    timeline = months.map((m) => {
      const value = requests
        .filter(
          (r) =>
            r.createdAt >= startOfMonth(m) && r.createdAt <= endOfMonth(m)
        )
        .reduce((s, r) => s + (r.amount || 0), 0);
      return { name: format(m, "MMM", { locale: es }), value };
    });
  } else {
    const weeks = eachWeekOfInterval({ start: from, end: to }, { weekStartsOn: 1 });
    timeline = weeks.map((w, i) => {
      const wEnd = endOfWeek(w, { weekStartsOn: 1 });
      const value = requests
        .filter((r) => r.createdAt >= w && r.createdAt <= wEnd)
        .reduce((s, r) => s + (r.amount || 0), 0);
      return { name: `Sem ${i + 1}`, value };
    });
  }

  const allTime = await prisma.workRequest.aggregate({
    _sum: { amount: true },
    _count: true,
  });

  const statusCounts = await prisma.workRequest.groupBy({
    by: ["workStatus"],
    _count: true,
  });

  return NextResponse.json({
    period,
    from,
    to,
    totalSales,
    paidSales,
    unpaidSales,
    requestCount: requests.length,
    byWorkStatus,
    byPayment,
    byDoctor,
    timeline: timeline.filter((t) => t.value > 0).length
      ? timeline
      : [{ name: "Sin ventas", value: 0 }],
    allTime: {
      total: allTime._sum.amount || 0,
      count: allTime._count,
      statusCounts,
    },
  });
}
