"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useLocale } from "@/contexts/LocaleContext";
import { areaToDisplay } from "@/lib/area-names";
import { METRIC_FORMULAS } from "@/lib/metric-formulas";

type FeedRow = {
  area: string;
  impressions: number;
  ctr: number;
  completion: number | null;
  replay: number | null;
};

function formatPct(n: number | null) {
  return n != null ? `${Number(n).toFixed(1)}%` : "-";
}

function ThWithTooltip({ label, metricKey }: { label: string; metricKey: string }) {
  const [show, setShow] = useState(false);
  const info = METRIC_FORMULAS[metricKey];

  return (
    <th
      className="relative px-3 py-2 text-right font-medium text-[var(--secondary-text)] tabular-nums"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <span className="cursor-help border-b border-dashed border-[var(--border)]">{label}</span>
      {show && info && (
        <div
          className="absolute right-0 bottom-full z-[100] mb-1 w-56 rounded-md border border-[var(--border)] bg-[var(--card-bg)] px-2 py-1.5 text-left text-[9px] leading-snug"
          style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}
        >
          <p className="font-semibold text-[var(--accent)]">{info.formula}</p>
          <p className="mt-0.5 text-[var(--secondary-text)]">{info.description}</p>
        </div>
      )}
    </th>
  );
}

function FeedTable({ title, rows, locale }: { title: string; rows: FeedRow[]; locale: string }) {
  return (
    <div>
      <h4 className="mb-2 text-xs font-medium text-[var(--secondary-text)]">{title}</h4>
      <table className="w-full text-[11px]">
        <thead>
          <tr className="border-b border-[var(--border)] bg-[var(--background)]">
            <th className="px-3 py-2 text-left font-medium text-[var(--secondary-text)]">AREA</th>
            <ThWithTooltip label="IMPRESSIONS" metricKey="FEED_IMPRESSIONS" />
            <ThWithTooltip label="CTR" metricKey="FEED_CTR" />
            <ThWithTooltip label="COMPLETION" metricKey="FEED_COMPLETION" />
            <ThWithTooltip label="REPLAY" metricKey="FEED_REPLAY" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.area} className="border-b border-[var(--border)]">
              <td className="px-3 py-2">{areaToDisplay(row.area, locale)}</td>
              <td className="px-3 py-2 text-right tabular-nums">
                {row.impressions.toLocaleString()}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">{formatPct(row.ctr)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{formatPct(row.completion)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{formatPct(row.replay)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ContentFeedChart({
  circle,
  featureCards,
  exclusives,
}: {
  circle: FeedRow[];
  featureCards: FeedRow[];
  exclusives: FeedRow[];
}) {
  const { t, locale } = useLocale();
  const completionLabel = `${t("completionRate")} %`;
  const chartData = [
    ...circle.map((r) => ({ area: areaToDisplay(r.area, locale), ctr: r.ctr, completion: r.completion ?? 0 })),
    ...featureCards.map((r) => ({ area: areaToDisplay(r.area, locale), ctr: r.ctr, completion: 0 })),
    ...exclusives.map((r) => ({ area: areaToDisplay(r.area, locale), ctr: r.ctr, completion: r.completion ?? 0 })),
  ].filter((d) => d.ctr > 0 || d.completion > 0);

  return (
    <div>
      <div className="mb-4 h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
            <XAxis dataKey="area" angle={-45} textAnchor="end" height={60} tick={{ fontSize: 10, fill: "var(--secondary-text)" }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "var(--secondary-text)" }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: "6px", border: "1px solid var(--border)", backgroundColor: "var(--card-bg)", padding: "3px 6px", fontSize: 9, lineHeight: 1.3 }}
              formatter={(value, name) => [`${Number(value ?? 0).toFixed(1)}%`, String(name) === "ctr" ? "CTR %" : completionLabel]}
            />
            <Legend wrapperStyle={{ fontSize: 9 }} iconSize={8} formatter={(v) => (v === "ctr" ? "CTR %" : completionLabel)} />
            <Bar dataKey="ctr" fill="#4285f4" radius={[2, 2, 0, 0]} name="ctr" />
            <Bar dataKey="completion" fill="#34a853" radius={[2, 2, 0, 0]} name="completion" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-4 overflow-visible">
        <FeedTable title="Circle" rows={circle} locale={locale} />
        <FeedTable title={t("featureCards")} rows={featureCards} locale={locale} />
        <FeedTable title={t("exclusives")} rows={exclusives} locale={locale} />
      </div>
    </div>
  );
}
