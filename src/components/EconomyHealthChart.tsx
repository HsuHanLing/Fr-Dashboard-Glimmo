"use client";

import { useState } from "react";
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useLocale } from "@/contexts/LocaleContext";
import { METRIC_FORMULAS } from "@/lib/metric-formulas";

type ChartItem = { indicator: string; value: number; label: string; unit?: string };
type MetricRow = { indicator: string; value: string };
type EconData = { chart: ChartItem[]; metrics: MetricRow[]; segment?: string; active_users?: number };

const COLORS = ["#4285f4", "#34a853", "#fbbc04"];

const INDICATOR_METRIC_KEYS: Record<string, string> = {
  "Avg unlocks / user / day": "ECON_AVG_UNLOCKS",
  "Scratch card open rate": "ECON_SCRATCH_RATE",
  "Upgrade card usage rate": "ECON_UPGRADE_RATE",
  "Avg reward per scratch": "ECON_AVG_REWARD",
};

function RowWithTooltip({ row }: { row: MetricRow }) {
  const [show, setShow] = useState(false);
  const metricKey = INDICATOR_METRIC_KEYS[row.indicator];
  const info = metricKey ? METRIC_FORMULAS[metricKey] : null;

  return (
    <tr
      className="border-b border-[var(--border)] relative"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <td className="relative px-3 py-2">
        <span className={info ? "cursor-help border-b border-dashed border-[var(--border)]" : ""}>
          {row.indicator}
        </span>
        {show && info && (
          <div
            className="absolute left-0 bottom-full z-[100] mb-1 w-64 rounded-md border border-[var(--border)] bg-[var(--card-bg)] px-2 py-1.5 text-[9px] leading-snug"
            style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}
          >
            <p className="font-semibold text-[var(--accent)]">{info.formula}</p>
            <p className="mt-0.5 text-[var(--secondary-text)]">{info.description}</p>
          </div>
        )}
      </td>
      <td className="px-3 py-2 text-right tabular-nums">{row.value}</td>
    </tr>
  );
}

export function EconomyHealthChart({
  data,
  segment,
  onSegmentChange,
  loading,
}: {
  data: EconData | null;
  segment: "all" | "paid";
  onSegmentChange: (seg: "all" | "paid") => void;
  loading?: boolean;
}) {
  const { locale, t } = useLocale();
  const chart = data?.chart ?? [];
  const metrics = data?.metrics ?? [];

  const displayData = chart.map((d) => ({
    ...d,
    display: locale === "en" ? d.label.replace(/\s*%\s*$/, "") : d.indicator,
  }));

  return (
    <div>
      {/* Segment toggle */}
      <div className="mb-3 flex items-center gap-1.5">
        {(["all", "paid"] as const).map((s) => (
          <button
            key={s}
            onClick={() => onSegmentChange(s)}
            className="rounded-full px-3 py-1 text-[10px] font-medium transition-colors"
            style={segment === s
              ? { backgroundColor: "var(--accent)", color: "#fff" }
              : { backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--secondary-text)" }}
          >
            {s === "all" ? t("all") : t("paid")}
          </button>
        ))}
        {data?.active_users != null && (
          <span className="ml-auto text-[10px] text-[var(--secondary-text)]">
            {segment === "paid" ? t("paidTotalPayers") : "DAU"}: {data.active_users.toLocaleString()}
          </span>
        )}
        {loading && (
          <span className="ml-2 inline-block h-3 w-3 animate-spin rounded-full border border-[var(--border)] border-t-[var(--accent)]" />
        )}
      </div>

      <div className="mb-4 h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={displayData} margin={{ top: 5, right: 10, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
            <XAxis dataKey="display" tick={{ fontSize: 10, fill: "var(--secondary-text)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "var(--secondary-text)" }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: "6px", border: "1px solid var(--border)", backgroundColor: "var(--card-bg)", padding: "3px 6px", fontSize: 9, lineHeight: 1.3 }}
              formatter={(value, _name, props) => {
                const v = Number(value ?? 0);
                const item = (props as { payload?: ChartItem })?.payload;
                const label = locale === "en" ? (item?.label ?? "") : (item?.indicator ?? "");
                const unit = item?.unit ?? "";
                return [`${v.toFixed(1)}${unit}`, label];
              }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {displayData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="rounded-xl overflow-visible" style={{ border: "1px solid var(--card-stroke)" }}>
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--background)]">
              <th className="px-3 py-2 text-left font-medium text-[var(--secondary-text)]">INDICATOR</th>
              <th className="px-3 py-2 text-right font-medium text-[var(--secondary-text)] tabular-nums">VALUE</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((row) => (
              <RowWithTooltip key={row.indicator} row={row} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
