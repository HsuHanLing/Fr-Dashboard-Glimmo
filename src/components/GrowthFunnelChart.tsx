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
  Cell,
} from "recharts";
import { useLocale } from "@/contexts/LocaleContext";
import { METRIC_FORMULAS } from "@/lib/metric-formulas";

type FunnelRow = { step: string; stepLabel: string; users: number; conversion: number };

const STEP_KEYS: Record<string, string> = {
  signup: "signup",
  activation: "activation",
  first_sup: "firstSup",
  first_up: "firstUp",
  first_unlock: "firstUnlock",
  first_pay: "firstPay",
};

const STEP_METRIC_KEYS: Record<string, string> = {
  signup: "FUNNEL_SIGNUP",
  activation: "FUNNEL_ACTIVATION",
  first_sup: "FUNNEL_FIRST_SUP",
  first_up: "FUNNEL_FIRST_UP",
  first_unlock: "FUNNEL_FIRST_UNLOCK",
  first_pay: "FUNNEL_FIRST_PAY",
};

const COLORS = ["#93c5fd", "#60a5fa", "#3b82f6", "#a78bfa", "#8b5cf6", "#6d28d9"];

function StepWithTooltip({ stepLabel, step }: { stepLabel: string; step: string }) {
  const [show, setShow] = useState(false);
  const metricKey = STEP_METRIC_KEYS[step];
  const info = metricKey ? METRIC_FORMULAS[metricKey] : null;

  return (
    <td
      className="relative px-3 py-2 text-[11px] text-[var(--foreground)]"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <span className="cursor-help border-b border-dashed border-[var(--border)]">{stepLabel}</span>
      {show && info && (
        <div
          className="absolute left-0 bottom-full z-[100] mb-1 w-56 rounded-md border border-[var(--border)] bg-[var(--card-bg)] px-1.5 py-1 text-[9px] leading-snug"
          style={{ boxShadow: "var(--shadow-tooltip)" }}
        >
          <p className="font-medium text-[var(--accent)]">{info.formula}</p>
          <p className="mt-0.5 text-[var(--secondary-text)]">{info.description}</p>
        </div>
      )}
    </td>
  );
}

function CellWithTooltip({
  value,
  metricKey,
  align = "right",
}: {
  value: string | number;
  metricKey: string;
  align?: "left" | "right";
}) {
  const [show, setShow] = useState(false);
  const info = METRIC_FORMULAS[metricKey];

  return (
    <td
      className={`relative px-3 py-2 text-[11px] text-[var(--foreground)] tabular-nums ${align === "right" ? "text-right" : ""}`}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <span className="cursor-help border-b border-dashed border-[var(--border)]">{value}</span>
      {show && info && (
        <div
          className={`absolute bottom-full z-[100] mb-1 w-56 rounded-md border border-[var(--border)] bg-[var(--card-bg)] px-1.5 py-1 text-[9px] leading-snug ${align === "right" ? "right-0" : "left-0"}`}
          style={{ boxShadow: "var(--shadow-tooltip)" }}
        >
          <p className="font-medium text-[var(--accent)]">{info.formula}</p>
          <p className="mt-0.5 text-[var(--secondary-text)]">{info.description}</p>
        </div>
      )}
    </td>
  );
}

export function GrowthFunnelChart({ data }: { data: FunnelRow[] }) {
  const { t } = useLocale();

  const displayData = data.map((d) => ({
    ...d,
    stepLabel: t((STEP_KEYS[d.step] || d.step) as Parameters<typeof t>[0]),
  }));

  if (!displayData.length) {
    return (
      <div className="flex h-[280px] items-center justify-center text-[var(--secondary-text)] text-xs">
        {t("noData")}
      </div>
    );
  }

  const maxUsers = Math.max(...displayData.map((d) => d.users), 1);

  return (
    <div className="overflow-visible">
      <div className="mb-4 h-[220px] w-full overflow-visible">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={displayData}
            layout="vertical"
            margin={{ top: 5, right: 20, left: 80, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} horizontal={false} />
            <XAxis
              type="number"
              domain={[0, Math.ceil(maxUsers * 1.1)]}
              tick={{ fontSize: 11, fill: "var(--secondary-text)" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v))}
            />
            <YAxis
              type="category"
              dataKey="stepLabel"
              width={75}
              tick={{ fontSize: 11, fill: "var(--secondary-text)" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "6px",
                border: "1px solid var(--border)",
                backgroundColor: "var(--card-bg)",
                padding: "3px 6px",
                fontSize: 9,
                lineHeight: 1.3,
              }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.[0] || !label) return null;
                const step = displayData.find((d) => d.stepLabel === label)?.step;
                const info = step && METRIC_FORMULAS[STEP_METRIC_KEYS[step]];
                return (
                  <div
                    className="rounded-md border border-[var(--border)] bg-[var(--card-bg)] px-1.5 py-1 text-[9px] leading-snug"
                    style={{ boxShadow: "var(--shadow-tooltip)" }}
                  >
                    <p className="font-medium text-[var(--accent)]">{typeof info === "object" && info && "formula" in info ? info.formula : label}</p>
                    {typeof info === "object" && info && "description" in info && info.description ? (
                      <p className="mt-0.5 text-[var(--secondary-text)]">{info.description}</p>
                    ) : null}
                    <p className="mt-0.5 tabular-nums">{t("userCount")}: {Number(payload[0].value).toLocaleString()}</p>
                  </div>
                );
              }}
            />
            <Bar dataKey="users" radius={[0, 4, 4, 0]} maxBarSize={24}>
              {displayData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mb-2 overflow-x-auto overflow-y-visible rounded-xl" style={{ border: "1px solid var(--card-stroke)" }}>
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--background)]">
              <th className="px-3 py-2 text-left font-medium text-[var(--secondary-text)]">{t("step")}</th>
              <th className="px-3 py-2 text-right font-medium text-[var(--secondary-text)] tabular-nums">{t("userCount")}</th>
              <th className="px-3 py-2 text-right font-medium text-[var(--secondary-text)] tabular-nums w-20">{t("conversionRate")}</th>
            </tr>
          </thead>
          <tbody>
            {displayData.map((row) => (
              <tr key={row.step} className="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--background)]">
                <StepWithTooltip stepLabel={row.stepLabel} step={row.step} />
                <CellWithTooltip value={row.users.toLocaleString()} metricKey={STEP_METRIC_KEYS[row.step] || "FUNNEL_SIGNUP"} />
                <CellWithTooltip value={`${row.conversion}%`} metricKey="FUNNEL_CONVERSION" />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] text-[var(--secondary-text)]">{t("funnelNote")}</p>
      <p className="text-[10px] text-[var(--secondary-text)] opacity-60">{t("funnelWindow")}</p>
    </div>
  );
}
