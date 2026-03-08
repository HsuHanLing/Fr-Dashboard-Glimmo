"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { useLocale } from "@/contexts/LocaleContext";

type MonetRow = {
  revenue_stream: string;
  revenue: number;
  share: number;
};

const COLORS = ["#4285f4", "#34a853", "#fbbc04", "#ea4335"];

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);
}

export function MonetizationChart({ data }: { data: MonetRow[] }) {
  const { t } = useLocale();
  const chartData = data.map((d) => ({ name: d.revenue_stream, value: d.revenue }));
  const legendLabel = (v: string) =>
    v === "Unlock Pack" ? t("unlockPack") : v === "Subscription" ? t("subscription") : v;

  return (
    <div>
      <div className="mb-4 h-[220px] w-full min-w-0 overflow-visible">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <Pie data={chartData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={1} dataKey="value">
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ borderRadius: "6px", border: "1px solid var(--border)", backgroundColor: "var(--card-bg)", padding: "3px 6px", fontSize: 9, lineHeight: 1.3 }}
              formatter={(value) => [formatCurrency(Number(value ?? 0)), "Revenue"]}
            />
            <Legend wrapperStyle={{ fontSize: 9 }} iconSize={8} formatter={(value) => legendLabel(String(value))} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="overflow-x-auto rounded-xl" style={{ border: "1px solid var(--card-stroke)" }}>
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--background)]">
              <th className="px-3 py-2 text-left font-medium text-[var(--secondary-text)]">{t("revenueStream")}</th>
              <th className="px-3 py-2 text-right font-medium text-[var(--secondary-text)] tabular-nums">{t("revenue")}</th>
              <th className="px-3 py-2 text-right font-medium text-[var(--secondary-text)] tabular-nums w-14">{t("share")}</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.revenue_stream} className="border-b border-[var(--border)]">
                <td className="px-3 py-2">{legendLabel(row.revenue_stream)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(row.revenue)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{row.share}%</td>
              </tr>
            ))}
            {data.length > 0 && (
              <tr className="bg-[var(--background)] font-medium">
                <td className="px-3 py-2">Total</td>
                <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(data.reduce((s, r) => s + r.revenue, 0))}</td>
                <td className="px-3 py-2 text-right tabular-nums">100%</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
