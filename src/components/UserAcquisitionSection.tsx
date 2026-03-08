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

type ChannelRow = {
  source: string;
  medium: string;
  channel: string;
  channel_desc: string;
  campaign: string;
  campaign_label: string;
  new_users: number;
  payers: number;
  revenue: number;
  conversion: number;
};

type ChannelSummaryRow = {
  channel: string;
  channel_desc: string;
  new_users: number;
  payers: number;
  revenue: number;
  conversion: number;
};

type ReferralRow = {
  source: string;
  campaign: string;
  campaign_label: string;
  medium: string;
  channel: string;
  channel_desc: string;
  events: number;
  users: number;
};

type Props = {
  channels: ChannelRow[];
  channelsSummary: ChannelSummaryRow[];
  referrals: ReferralRow[];
  analyticsDays: number;
  t: (key: string) => string;
};

const COLORS = ["#4285f4", "#34a853", "#fbbc04", "#ea4335", "#8ab4f8", "#f28b82", "#fdd663", "#81c995", "#9334e6", "#e040fb"];

function ChannelWithTooltip({ channel, desc }: { channel: string; desc: string }) {
  const [show, setShow] = useState(false);
  return (
    <td
      className="relative px-2 py-1.5 text-[var(--accent)] text-[9px] whitespace-nowrap"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <span className="cursor-help border-b border-dashed border-[var(--accent)]/40">{channel}</span>
      {show && desc && (
        <div
          className="absolute left-0 bottom-full z-[100] mb-1 w-52 rounded-md border border-[var(--border)] bg-[var(--card-bg)] px-2 py-1.5 text-[9px] leading-snug"
          style={{ boxShadow: "0 2px 8px rgba(0,0,0,.15)" }}
        >
          <p className="font-medium text-[var(--foreground)]">{channel}</p>
          <p className="mt-0.5 text-[var(--secondary-text)]">{desc}</p>
        </div>
      )}
    </td>
  );
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);
}

const badgeStyle = { backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--secondary-text)" } as const;
const cardStyle = { border: "1px solid var(--card-stroke)", boxShadow: "var(--card-shadow)" } as const;

type ViewMode = "summary" | "detail";

export function UserAcquisitionSection({ channels, channelsSummary, referrals, analyticsDays, t }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>("summary");

  const summaryChartData = channelsSummary.slice(0, 10).map((c) => ({
    channel: c.channel.length > 22 ? c.channel.slice(0, 20) + "…" : c.channel,
    new_users: c.new_users,
  }));

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold tracking-tight">{t("acqTitle")}</h2>
        <span className="rounded px-1.5 py-0.5 text-[9px] font-medium" style={badgeStyle}>
          {t("lastNDays").replace("{n}", String(analyticsDays))}
        </span>
      </div>
      <p className="mt-0.5 mb-4 text-xs text-[var(--secondary-text)]">{t("acqDesc")}</p>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Channel Distribution Chart + Table */}
        <div className="rounded-xl bg-[var(--card-bg)] p-4" style={cardStyle}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-medium text-[var(--secondary-text)]">{t("acqChannelDist")}</p>
            <div className="flex gap-1">
              {(["summary", "detail"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className="rounded px-2 py-0.5 text-[9px] font-medium transition-colors"
                  style={{
                    backgroundColor: viewMode === mode ? "var(--accent)" : "var(--background)",
                    color: viewMode === mode ? "#fff" : "var(--secondary-text)",
                    border: "1px solid var(--border)",
                  }}
                >
                  {mode === "summary" ? t("acqChannel") : t("acqSource") + " / " + t("acqMedium")}
                </button>
              ))}
            </div>
          </div>

          {summaryChartData.length > 0 && viewMode === "summary" && (
            <div className="mb-3" style={{ width: "100%", height: Math.max(200, summaryChartData.length * 28) }}>
              <ResponsiveContainer>
                <BarChart data={summaryChartData} layout="vertical" margin={{ top: 4, right: 12, bottom: 4, left: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis type="number" tick={{ fontSize: 9, fill: "var(--secondary-text)" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="channel" tick={{ fontSize: 9, fill: "var(--secondary-text)" }} axisLine={false} tickLine={false} width={140} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 10 }}
                    formatter={(value) => [Number(value ?? 0).toLocaleString(), t("acqNewUsers")]}
                  />
                  <Bar dataKey="new_users" radius={[0, 4, 4, 0]} maxBarSize={20}>
                    {summaryChartData.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="overflow-x-auto">
            {viewMode === "summary" ? (
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--background)]">
                    <th className="px-2 py-1.5 text-left font-medium text-[var(--secondary-text)]">{t("acqChannel")}</th>
                    <th className="px-2 py-1.5 text-right font-medium text-[var(--secondary-text)]">{t("acqNewUsers")}</th>
                    <th className="px-2 py-1.5 text-right font-medium text-[var(--secondary-text)]">{t("paidTotalPayers")}</th>
                    <th className="px-2 py-1.5 text-right font-medium text-[var(--secondary-text)]">{t("acqConversion")}</th>
                    <th className="px-2 py-1.5 text-right font-medium text-[var(--secondary-text)]">{t("revenue")}</th>
                  </tr>
                </thead>
                <tbody>
                  {channelsSummary.map((row, i) => (
                    <tr key={`${row.channel}-${i}`} className="border-b border-[var(--border)]/50">
                      <ChannelWithTooltip channel={row.channel} desc={row.channel_desc} />
                      <td className="px-2 py-1.5 text-right tabular-nums">{row.new_users.toLocaleString()}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{row.payers.toLocaleString()}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-[var(--secondary-text)]">{row.conversion}%</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{formatCurrency(row.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--background)]">
                    <th className="px-2 py-1.5 text-left font-medium text-[var(--secondary-text)]">{t("acqChannel")}</th>
                    <th className="px-2 py-1.5 text-left font-medium text-[var(--secondary-text)]">{t("acqCampaign")}</th>
                    <th className="px-2 py-1.5 text-right font-medium text-[var(--secondary-text)]">{t("acqNewUsers")}</th>
                    <th className="px-2 py-1.5 text-right font-medium text-[var(--secondary-text)]">{t("paidTotalPayers")}</th>
                    <th className="px-2 py-1.5 text-right font-medium text-[var(--secondary-text)]">{t("acqConversion")}</th>
                    <th className="px-2 py-1.5 text-right font-medium text-[var(--secondary-text)]">{t("revenue")}</th>
                  </tr>
                </thead>
                <tbody>
                  {channels.map((row, i) => (
                    <tr key={`${row.source}-${row.medium}-${row.campaign}-${i}`} className="border-b border-[var(--border)]/50">
                      <ChannelWithTooltip channel={row.channel} desc={row.channel_desc} />
                      <td className="px-2 py-1.5 text-[var(--foreground)] max-w-[200px]">
                        <span className="font-medium">{row.campaign_label}</span>
                        {row.campaign_label !== row.campaign && row.campaign_label !== "—" && (
                          <span className="block text-[8px] text-[var(--secondary-text)] truncate opacity-60">{row.campaign}</span>
                        )}
                      </td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{row.new_users.toLocaleString()}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{row.payers.toLocaleString()}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-[var(--secondary-text)]">{row.conversion}%</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{formatCurrency(row.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Download / Referral Tracking */}
        <div className="rounded-xl bg-[var(--card-bg)] p-4" style={cardStyle}>
          <p className="text-[11px] font-medium text-[var(--secondary-text)] mb-3">{t("acqReferralTitle")}</p>
          <p className="text-[10px] text-[var(--secondary-text)] mb-3">{t("acqReferralDesc")}</p>
          {referrals.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--background)]">
                    <th className="px-2 py-1.5 text-left font-medium text-[var(--secondary-text)]">{t("acqChannel")}</th>
                    <th className="px-2 py-1.5 text-left font-medium text-[var(--secondary-text)]">{t("acqCampaign")}</th>
                    <th className="px-2 py-1.5 text-right font-medium text-[var(--secondary-text)]">{t("acqEvents")}</th>
                    <th className="px-2 py-1.5 text-right font-medium text-[var(--secondary-text)]">{t("acqUsers")}</th>
                  </tr>
                </thead>
                <tbody>
                  {referrals.map((row, i) => (
                    <tr key={`${row.source}-${row.campaign}-${i}`} className="border-b border-[var(--border)]/50">
                      <ChannelWithTooltip channel={row.channel} desc={row.channel_desc} />
                      <td className="px-2 py-1.5 text-[var(--foreground)] max-w-[200px]">
                        <span className="font-medium">{row.campaign_label !== "—" ? row.campaign_label : row.campaign}</span>
                        {row.campaign_label !== row.campaign && row.campaign_label !== "—" && (
                          <span className="block text-[8px] text-[var(--secondary-text)] truncate opacity-60">{row.campaign}</span>
                        )}
                      </td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{row.events.toLocaleString()}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums">{row.users.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-8 text-center text-xs text-[var(--secondary-text)]">{t("noData")}</p>
          )}
        </div>
      </div>
    </section>
  );
}
