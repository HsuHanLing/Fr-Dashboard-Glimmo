"use client";

import { useState, useEffect } from "react";
import { METRIC_FORMULAS } from "@/lib/metric-formulas";

type FunnelStep = { step: string; label: string; users: number; events?: number; sub?: string };
type DailyRow = { date: string; invite_users: number; sent_users: number; landing_users: number; open_users: number };
type Summary = { invite_to_sent_rate: number; landing_to_click_rate: number; click_to_open_rate: number; overall_conversion: number };

type Props = {
  analyticsDays: number;
  t: (key: string) => string;
};

function InfoTooltip({ metricKey }: { metricKey: string }) {
  const [show, setShow] = useState(false);
  const info = METRIC_FORMULAS[metricKey];
  if (!info) return null;
  return (
    <span className="relative ml-1 inline-flex cursor-help items-center" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3 text-[var(--secondary-text)]">
        <path fillRule="evenodd" d="M15 8A7 7 0 1 1 1 8a7 7 0 0 1 14 0ZM9 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM6.75 8a.75.75 0 0 0 0 1.5h.75v1.75a.75.75 0 0 0 1.5 0v-2.5A.75.75 0 0 0 8.25 8h-1.5Z" clipRule="evenodd" />
      </svg>
      {show && (
        <span className="absolute bottom-full left-1/2 z-[100] mb-2 w-[260px] -translate-x-1/2 rounded-md border border-[var(--border)] bg-[var(--card-bg)] px-2.5 py-2 text-[9px] leading-snug" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}>
          <span className="block font-semibold text-[var(--accent)]">{info.formula}</span>
          <span className="mt-1 block text-[var(--secondary-text)]">{info.description}</span>
        </span>
      )}
    </span>
  );
}

const cardStyle = { border: "1px solid var(--card-stroke)", boxShadow: "var(--card-shadow)" } as const;
const badgeStyle = { backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--secondary-text)" } as const;

const STEP_TOOLTIPS: Record<string, string> = {
  invite_attempt: "FW_INVITE_CLICKS",
  invite_sent: "FW_INVITE_SENT",
  landing_view: "FW_LANDING_SHOW",
  landing_click: "FW_LANDING_CLICK",
  deeplink_open: "FW_DEEPLINK_OPEN",
  referral_reg: "REF_REFERRAL_REGISTRATIONS",
};

const SUMMARY_TOOLTIPS: Record<string, string> = {
  invite_to_sent_rate: "REF_INVITE_TO_SENT",
  landing_to_click_rate: "REF_LANDING_TO_CLICK",
  click_to_open_rate: "REF_CLICK_TO_OPEN",
  overall_conversion: "REF_OVERALL_CONVERSION",
};

export function ReferralRewardSection({ analyticsDays, t }: Props) {
  const [data, setData] = useState<{ funnel: FunnelStep[]; dailyData: DailyRow[]; summary: Summary } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/marketing/referral-reward?days=${analyticsDays}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [analyticsDays]);

  if (loading) {
    return (
      <section className="mb-8">
        <h2 className="text-base font-semibold tracking-tight">{t("referralRewardTitle")}</h2>
        <div className="mt-4 flex h-[200px] items-center justify-center text-xs text-[var(--secondary-text)]">{t("loadingText")}</div>
      </section>
    );
  }

  if (!data || !data.funnel.length) {
    return (
      <section className="mb-8">
        <h2 className="text-base font-semibold tracking-tight">{t("referralRewardTitle")}</h2>
        <div className="mt-4 flex h-[120px] items-center justify-center text-xs text-[var(--secondary-text)]">{t("noData")}</div>
      </section>
    );
  }

  const { funnel, summary } = data;
  const maxUsers = Math.max(...funnel.map((f) => f.users), 1);

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold tracking-tight">{t("referralRewardTitle")}</h2>
        <span className="rounded px-1.5 py-0.5 text-[9px] font-medium" style={badgeStyle}>
          {t("lastNDays").replace("{n}", String(analyticsDays))}
        </span>
      </div>
      <p className="mb-4 mt-0.5 text-xs text-[var(--secondary-text)]">{t("referralRewardDesc")}</p>

      <div className="grid gap-4 lg:grid-cols-4">
        {[
          { label: "Invite → Sent", value: summary.invite_to_sent_rate, key: "invite_to_sent_rate" },
          { label: "Landing → Click", value: summary.landing_to_click_rate, key: "landing_to_click_rate" },
          { label: "Click → App Open", value: summary.click_to_open_rate, key: "click_to_open_rate" },
          { label: "Overall Conversion", value: summary.overall_conversion, key: "overall_conversion" },
        ].map((c) => (
          <div key={c.key} className="overflow-visible rounded-xl bg-[var(--card-bg)] p-4" style={cardStyle}>
            <p className="flex items-center text-[10px] text-[var(--secondary-text)]">
              {c.label}
              <InfoTooltip metricKey={SUMMARY_TOOLTIPS[c.key]} />
            </p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-[var(--foreground)]">{c.value}%</p>
          </div>
        ))}
      </div>

      {/* Funnel visualization */}
      <div className="mt-4 overflow-visible rounded-xl bg-[var(--card-bg)] p-4" style={cardStyle}>
        <p className="mb-3 text-[11px] font-medium text-[var(--secondary-text)]">{t("referralFunnel")}</p>
        <div className="space-y-2">
          {funnel.map((step, i) => {
            const barWidth = Math.max((step.users / maxUsers) * 100, 2);
            const prevUsers = i > 0 ? funnel[i - 1].users : step.users;
            const dropoff = i > 0 && prevUsers > 0
              ? Math.round(((prevUsers - step.users) / prevUsers) * 100)
              : 0;
            return (
              <div key={step.step} className="flex items-center gap-3">
                <div className="w-[140px] shrink-0 text-right">
                  <span className="flex items-center justify-end text-[11px] text-[var(--foreground)]">
                    {step.label}
                    {STEP_TOOLTIPS[step.step] && <InfoTooltip metricKey={STEP_TOOLTIPS[step.step]} />}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-6 rounded"
                      style={{
                        width: `${barWidth}%`,
                        backgroundColor: `hsl(${160 - i * 20}, 50%, ${55 + i * 3}%)`,
                        transition: "width 0.3s ease",
                      }}
                    />
                    <span className="text-xs font-semibold tabular-nums text-[var(--foreground)]">{step.users.toLocaleString()}</span>
                    {step.events !== undefined && step.events > 0 && (
                      <span className="text-[9px] text-[var(--secondary-text)]">({step.events.toLocaleString()} events)</span>
                    )}
                    {step.sub && <span className="text-[9px] text-[var(--secondary-text)]">({step.sub})</span>}
                    {dropoff > 0 && (
                      <span className="text-[9px] text-red-400">-{dropoff}%</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
