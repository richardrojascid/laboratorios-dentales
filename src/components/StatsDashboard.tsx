"use client";

import { useEffect, useState } from "react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { formatCLP } from "@/lib/format";

type Stats = {
  period: string;
  totalSales: number;
  paidSales: number;
  unpaidSales: number;
  requestCount: number;
  byWorkStatus: { name: string; value: number }[];
  byPayment: { name: string; value: number; amount: number }[];
  byDoctor: { name: string; value: number }[];
  timeline: { name: string; value: number }[];
};

const COLORS = ["#1A5F7A", "#159895", "#F4A261", "#2F8F6B", "#C45C5C", "#5B737C"];

export function StatsDashboard() {
  const [period, setPeriod] = useState("month");
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/stats?period=${period}`)
      .then((r) => r.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [period]);

  if (loading || !stats) {
    return <div className="panel empty">Cargando estadísticas...</div>;
  }

  const salesPie = stats.timeline.filter((t) => t.value > 0);
  const paymentPie = stats.byPayment.map((p) => ({
    name: p.name,
    value: p.amount || p.value,
  }));

  return (
    <div className="space-y-4">
      <div className="panel p-5 animate-rise mobile-stack row">
        <div>
          <h2 className="text-2xl mb-1">Estadísticas de ventas</h2>
          <p className="text-sm text-[var(--muted)]">
            Gráficos de torta por día, semana, mes y año.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            ["day", "Día"],
            ["week", "Semana"],
            ["month", "Mes"],
            ["year", "Año"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`btn ${period === value ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setPeriod(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="stat-cards animate-rise delay-1">
        <div className="panel p-4">
          <div className="text-xs uppercase tracking-wide text-[var(--muted)]">Ventas</div>
          <div className="text-2xl font-semibold mt-1">{formatCLP(stats.totalSales)}</div>
        </div>
        <div className="panel p-4">
          <div className="text-xs uppercase tracking-wide text-[var(--muted)]">Pagado</div>
          <div className="text-2xl font-semibold mt-1">{formatCLP(stats.paidSales)}</div>
        </div>
        <div className="panel p-4">
          <div className="text-xs uppercase tracking-wide text-[var(--muted)]">Por cobrar</div>
          <div className="text-2xl font-semibold mt-1">{formatCLP(stats.unpaidSales)}</div>
        </div>
        <div className="panel p-4">
          <div className="text-xs uppercase tracking-wide text-[var(--muted)]">Solicitudes</div>
          <div className="text-2xl font-semibold mt-1">{stats.requestCount}</div>
        </div>
      </div>

      <div className="chart-grid">
        <div className="panel p-4 animate-rise delay-2">
          <h3 className="text-lg mb-3">Ventas del período</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={salesPie.length ? salesPie : [{ name: "Sin datos", value: 1 }]}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label
                >
                  {(salesPie.length ? salesPie : [{ name: "Sin datos", value: 1 }]).map(
                    (_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    )
                  )}
                </Pie>
                <Tooltip formatter={(v) => formatCLP(Number(v))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel p-4 animate-rise delay-3">
          <h3 className="text-lg mb-3">Pagado vs no pagado</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentPie}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label
                >
                  {paymentPie.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatCLP(Number(v))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel p-4">
          <h3 className="text-lg mb-3">Estado de trabajos</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.byWorkStatus}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label
                >
                  {stats.byWorkStatus.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel p-4">
          <h3 className="text-lg mb-3">Ventas por doctor</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={
                    stats.byDoctor.length
                      ? stats.byDoctor
                      : [{ name: "Sin datos", value: 1 }]
                  }
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label
                >
                  {(stats.byDoctor.length
                    ? stats.byDoctor
                    : [{ name: "Sin datos", value: 1 }]
                  ).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatCLP(Number(v))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
