"use client";

import { useState } from "react";
import { METRIC_FORMULAS } from "@/lib/metric-formulas";

type NodeMetrics = Record<string, number>;
type FlywheelNode = {
  id: string;
  name: string;
  nameCn: string;
  metrics: NodeMetrics;
  status: "healthy" | "warning" | "broken";
  score: number;
  conversion: number | null;
  conversion_num?: number | null;
  conversion_denom?: number | null;
  benchmark: string;
};

type Props = {
  nodes: FlywheelNode[];
  overallScore: number;
  summary: { total_active?: number; payers?: number; pay_rate?: number; first_open?: number };
  days: number;
  t: (key: string) => string;
};

const NODE_I18N_KEYS: Record<string, string> = {
  discovery: "fwDiscovery",
  registration: "fwRegistration",
  first_unlock: "fwFirstUnlock",
  loop: "fwLoop",
  scratch: "fwScratch",
  share: "fwShare",
  cashout: "fwCashout",
  referral: "fwReferral",
};

const STATUS_KEYS: Record<string, string> = {
  healthy: "fwHealthy",
  warning: "fwWarning",
  broken: "fwBroken",
};

function getNodeLabel(id: string, t: (key: string) => string): string {
  return t(NODE_I18N_KEYS[id] || id);
}

function getStatusLabel(status: string, t: (key: string) => string): string {
  return t(STATUS_KEYS[status] || status);
}

const STATUS_DOT: Record<string, string> = {
  healthy: "#34a853",
  warning: "#fbbc04",
  broken: "#ea4335",
};

const cardStyle = { border: "1px solid var(--card-stroke)", boxShadow: "var(--card-shadow)" } as const;
const badgeStyle = { backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--secondary-text)" } as const;

// Maps each metric key inside node.metrics → its METRIC_FORMULAS key
const METRIC_FORMULA_MAP: Record<string, Record<string, string>> = {
  discovery: { first_open: "FW_FIRST_OPEN", first_open_7d: "FW_FIRST_OPEN_7D", wow_change: "FW_WOW_CHANGE", daily_avg: "FW_DAILY_AVG" },
  registration: { registered: "FW_REGISTERED", rate: "FW_REG_RATE" },
  first_unlock: { first_unlock: "FW_FIRST_UNLOCK", rate: "FW_UNLOCK_RATE" },
  loop: { total_unlockers: "FW_TOTAL_UNLOCKERS", loop_users: "FW_LOOP_USERS", power_users: "FW_POWER_USERS", avg_unlocks: "FW_AVG_UNLOCKS", loop_rate: "FW_LOOP_RATE" },
  scratch: { scratch_users: "FW_SCRATCH_USERS", reward_users: "FW_REWARD_USERS", total_diamonds: "FW_TOTAL_DIAMONDS", avg_reward: "FW_AVG_REWARD", scratch_rate: "FW_SCRATCH_RATE" },
  share: { scratch_users: "FW_SCRATCH_USERS", scratch_share_users: "FW_SCRATCH_SHARE", share_success: "SHARE_SUCCESS", share_cancel: "SHARE_CANCEL", share_fail: "SHARE_FAIL", share_rate: "FW_SHARE_RATE", share_success_rate: "FW_SHARE_SUCCESS_RATE" },
  cashout: { scratch_users: "FW_SCRATCH_USERS", cashout_users: "FW_CASHOUT_USERS", cashout_success: "FW_CASHOUT_USERS", cashout_rate: "FW_CASHOUT_RATE" },
  referral: { all_share_users: "FW_INVITE_CLICKS", all_share_clicks: "FW_INVITE_CLICKS", invite_button: "FW_INVITE_CLICKS", text_invite: "SHARE_INVITE_SENT", snapchat_invite: "FW_INVITE_CLICKS", share_link: "SHARE_INVITE_LINK", invite_success_users: "FW_INVITE_SENT", invite_success_events: "FW_INVITE_SENT", landing_show_users: "FW_LANDING_SHOW", landing_click_users: "FW_LANDING_CLICK", deeplink_open_users: "FW_DEEPLINK_OPEN", invite_success_rate: "FW_REFERRAL_RATE", referral_rate: "FW_REFERRAL_RATE" },
};

// Maps summary keys → formula keys
const SUMMARY_FORMULA_MAP: Record<string, string> = {
  total_active: "FW_ACTIVE_USERS",
  first_open: "FW_NEW_USERS",
  pay_rate: "FW_PAY_RATE",
  score: "FW_SCORE",
};

const METRIC_LABELS: Record<string, string> = {
  first_open: "First Opens",
  first_open_7d: "Last 7d",
  wow_change: "WoW %",
  daily_avg: "Daily avg",
  registered: "Registered",
  rate: "Conversion",
  first_unlock: "First Unlocks",
  total_unlockers: "Total Unlockers",
  loop_users: "Loop (2+)",
  power_users: "Power (10+)",
  avg_unlocks: "Avg/User",
  loop_rate: "Loop rate",
  scratch_users: "Scratch Users",
  reward_users: "Rewarded",
  total_diamonds: "Diamonds",
  avg_reward: "Avg reward",
  scratch_rate: "Scratch rate",
  scratch_share_users: "Shared",
  share_success: "Success",
  share_cancel: "Cancelled",
  share_fail: "Failed",
  share_rate: "Scratch-to-share",
  share_success_rate: "Success rate",
  cashout_users: "Cashout",
  cashout_success: "Success",
  cashout_rate: "Rate",
  invite_click_users: "Invite Clicks",
  invite_success_users: "Invite Sent",
  invite_success_events: "Invites",
  all_share_users: "All Share Users",
  all_share_clicks: "All Share Clicks",
  invite_button: "Invite Button",
  text_invite: "Via Text",
  snapchat_invite: "Snapchat",
  share_link: "Share Link",
  landing_show_users: "Landing Views",
  landing_click_users: "Landing Clicks",
  deeplink_open_users: "App Opens via Link",
  invite_success_rate: "Invite Success Rate",
  referral_rate: "Referral rate",
};

function formatConversionWithFraction(
  pct: number | null,
  num: number | null | undefined,
  denom: number | null | undefined
): string {
  if (pct === null) return "—";
  const hasFraction = typeof num === "number" && typeof denom === "number" && denom > 0;
  return hasFraction ? `${pct}% (${num}/${denom})` : `${pct}%`;
}

function formatVal(
  key: string,
  val: number,
  node: FlywheelNode
): string {
  const metrics = node.metrics;
  if (key === "scratch_rate_denom" || key === "share_success_denom" || key === "referral_rate_denom") return "";
  if (key.includes("rate") || key === "rate" || key === "wow_change") {
    let num: number | null = null;
    let denom: number | null = null;
    if (key === "rate") {
      num = node.conversion_num ?? null;
      denom = node.conversion_denom ?? null;
    } else {
      num = key === "loop_rate" ? metrics.loop_users : key === "scratch_rate" ? metrics.scratch_users : key === "share_rate" ? metrics.scratch_share_users : key === "share_success_rate" ? metrics.share_success : key === "cashout_rate" ? metrics.cashout_users : key === "invite_success_rate" ? metrics.invite_success_users : key === "referral_rate" ? metrics.invite_success_users : null;
      denom = key === "loop_rate" ? metrics.total_unlockers : key === "scratch_rate" ? metrics.scratch_rate_denom : key === "share_rate" ? metrics.scratch_users : key === "share_success_rate" ? metrics.share_success_denom : key === "cashout_rate" ? metrics.scratch_users : key === "invite_success_rate" ? metrics.all_share_users : key === "referral_rate" ? metrics.referral_rate_denom : null;
    }
    if (typeof num === "number" && typeof denom === "number" && denom > 0) return `${val}% (${num}/${denom})`;
    return `${val}%`;
  }
  if (key === "avg_unlocks") return val.toFixed(1);
  if (key === "total_diamonds") return val.toLocaleString();
  return val.toLocaleString();
}

function InfoTooltip({ metricKey }: { metricKey: string }) {
  const [show, setShow] = useState(false);
  const info = METRIC_FORMULAS[metricKey];
  if (!info) return null;

  return (
    <span
      className="relative ml-1 inline-flex cursor-help items-center"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3 text-[var(--secondary-text)]">
        <path fillRule="evenodd" d="M15 8A7 7 0 1 1 1 8a7 7 0 0 1 14 0ZM9 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM6.75 8a.75.75 0 0 0 0 1.5h.75v1.75a.75.75 0 0 0 1.5 0v-2.5A.75.75 0 0 0 8.25 8h-1.5Z" clipRule="evenodd" />
      </svg>
      {show && (
        <span
          className="absolute bottom-full left-1/2 z-[100] mb-2 w-[260px] -translate-x-1/2 rounded-md border border-[var(--border)] bg-[var(--card-bg)] px-2.5 py-2 text-[9px] leading-snug"
          style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}
        >
          <span className="block font-semibold text-[var(--accent)]">{info.formula}</span>
          <span className="mt-1 block text-[var(--secondary-text)]">{info.description}</span>
        </span>
      )}
    </span>
  );
}

export function FlywheelSection({ nodes, overallScore, summary, days, t }: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  if (!nodes.length) {
    return (
      <section className="mb-8">
        <div className="overflow-visible rounded-xl bg-[var(--card-bg)] p-4 sm:p-5" style={cardStyle}>
          <h2 className="text-base font-semibold tracking-tight">{t("fwTitle")}</h2>
          <p className="mt-2 text-xs text-[var(--secondary-text)]">{t("loadingText")}</p>
        </div>
      </section>
    );
  }

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  return (
    <section className="mb-8 space-y-6">
      {/* Main funnel card */}
      <div className="overflow-visible rounded-xl bg-[var(--card-bg)] p-4 sm:p-5" style={cardStyle}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold tracking-tight">{t("fwTitle")}</h2>
            <p className="mt-0.5 text-[11px] text-[var(--secondary-text)]">{t("fwDesc")}</p>
          </div>
          <span className="rounded px-1.5 py-0.5 text-[9px] font-medium" style={badgeStyle}>
            {t("lastNDays").replace("{n}", String(days))}
          </span>
        </div>

        {/* Summary KPIs with hover tooltips */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg p-2.5" style={{ backgroundColor: "var(--background)" }}>
            <p className="flex items-center text-[10px] text-[var(--secondary-text)]">
              {t("fwActiveUsers")}
              <InfoTooltip metricKey="FW_ACTIVE_USERS" />
            </p>
            <p className="mt-0.5 text-lg font-semibold tracking-tight">{(summary.total_active ?? 0).toLocaleString()}</p>
          </div>
          <div className="rounded-lg p-2.5" style={{ backgroundColor: "var(--background)" }}>
            <p className="flex items-center text-[10px] text-[var(--secondary-text)]">
              {t("fwNewUsers")}
              <InfoTooltip metricKey="FW_NEW_USERS" />
            </p>
            <p className="mt-0.5 text-lg font-semibold tracking-tight">{(summary.first_open ?? 0).toLocaleString()}</p>
          </div>
          <div className="rounded-lg p-2.5" style={{ backgroundColor: "var(--background)" }}>
            <p className="flex items-center text-[10px] text-[var(--secondary-text)]">
              {t("fwPayRate")}
              <InfoTooltip metricKey="FW_PAY_RATE" />
            </p>
            <p className="mt-0.5 text-lg font-semibold tracking-tight">{summary.pay_rate ?? 0}%</p>
          </div>
          <div className="rounded-lg p-2.5" style={{ backgroundColor: "var(--background)" }}>
            <p className="flex items-center text-[10px] text-[var(--secondary-text)]">
              {t("fwScore")}
              <InfoTooltip metricKey="FW_SCORE" />
            </p>
            <p className="mt-0.5 text-lg font-semibold tracking-tight">{overallScore}/10</p>
          </div>
        </div>

        {/* Funnel diagram */}
        <div className="mt-6 overflow-x-auto pb-2">
          <div className="flex min-w-0 flex-wrap items-stretch justify-center gap-0">
            {nodes.map((node, i) => {
              const mainVal = node.id === "discovery"
                ? (node.metrics.first_open ?? 0).toLocaleString()
                : formatConversionWithFraction(node.conversion, node.conversion_num, node.conversion_denom);
              const dot = STATUS_DOT[node.status];
              return (
                <div key={node.id} className="flex items-center">
                  <div
                    className="flex min-w-[72px] max-w-[88px] flex-col items-center rounded-lg border border-[var(--border)] bg-[var(--background)] px-2 py-3 text-center sm:min-w-[80px] sm:px-3"
                    style={{ borderLeftWidth: 3, borderLeftColor: dot }}
                  >
                    <span className="text-[10px] font-medium text-[var(--secondary-text)]">
                      {getNodeLabel(node.id, t)}
                    </span>
                    <span className="mt-1 text-base font-semibold tracking-tight text-[var(--foreground)]">
                      {mainVal}
                    </span>
                    <span className="mt-0.5 text-[9px] text-[var(--secondary-text)]">
                      {node.score}/10 · {getStatusLabel(node.status, t)}
                    </span>
                  </div>
                  {i < nodes.length - 1 && (
                    <svg className="mx-0.5 shrink-0 text-[var(--secondary-text)]" width="16" height="24" viewBox="0 0 16 24" aria-hidden>
                      <path d="M2 12h10m-3-4l3 4-3 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Health tags */}
        {nodes.some((n) => n.status !== "healthy") && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--border)] pt-4">
            {nodes
              .filter((n) => n.status !== "healthy")
              .map((n) => (
                <span key={n.id} className="text-[10px]" style={{ color: STATUS_DOT[n.status] }}>
                  {getNodeLabel(n.id, t)}: {getStatusLabel(n.status, t)}
                </span>
              ))}
          </div>
        )}
      </div>

      {/* Per-node detail cards */}
      {nodes.map((node) => {
        const formulaMap = METRIC_FORMULA_MAP[node.id] || {};
        return (
          <div
            key={node.id}
            className="overflow-visible rounded-xl bg-[var(--card-bg)]"
            style={{ ...cardStyle, borderLeftWidth: 3, borderLeftColor: STATUS_DOT[node.status] }}
          >
            <button
              type="button"
              onClick={() => toggle(node.id)}
              className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-[var(--background)]/50"
            >
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-[12px] font-semibold">{getNodeLabel(node.id, t)}</span>
                {node.conversion !== null && (
                  <span className="text-[11px] text-[var(--secondary-text)]">
                    {t("fwConversion")}: {formatConversionWithFraction(node.conversion, node.conversion_num, node.conversion_denom)}
                  </span>
                )}
                <span className="text-[10px] text-[var(--secondary-text)]">
                  {node.score}/10 · {getStatusLabel(node.status, t)}
                </span>
              </div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className={`h-4 w-4 shrink-0 text-[var(--secondary-text)] transition-transform ${expanded[node.id] ? "rotate-180" : ""}`}
              >
                <path fillRule="evenodd" d="M4.22 6.22a.75.75 0 011.06 0L8 8.94l2.72-2.72a.75.75 0 111.06 1.06l-3.25 3.25a.75.75 0 01-1.06 0L4.22 7.28a.75.75 0 010-1.06z" clipRule="evenodd" />
              </svg>
            </button>
            {expanded[node.id] && (
              <div className="overflow-visible border-t border-[var(--border)] bg-[var(--background)]/30 px-4 py-3">
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3 lg:grid-cols-4">
                  {Object.entries(node.metrics)
                    .filter(([key]) => !key.endsWith("_denom"))
                    .map(([key, val]) => {
                      const formatted = formatVal(key, val, node);
                      if (formatted === "") return null;
                      return (
                        <div key={key}>
                          <p className="flex items-center text-[10px] text-[var(--secondary-text)]">
                            {METRIC_LABELS[key] || key}
                            {formulaMap[key] && <InfoTooltip metricKey={formulaMap[key]} />}
                          </p>
                          <p className="text-[12px] font-medium">{formatted}</p>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
}
