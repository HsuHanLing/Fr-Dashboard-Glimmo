"use client";

import { useState } from "react";
import { METRIC_FORMULAS } from "@/lib/metric-formulas";

type ShareNode = {
  id: string;
  metrics: Record<string, number>;
};

type Props = {
  shareNode: ShareNode | null;
  referralNode: ShareNode | null;
  analyticsDays: number;
  t: (key: string) => string;
};

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

const cardStyle = { border: "1px solid var(--card-stroke)", boxShadow: "var(--card-shadow)" } as const;
const badgeStyle = { backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--secondary-text)" } as const;

export function ShareDataSection({ shareNode, referralNode, analyticsDays, t }: Props) {
  const scratchShareUsers = shareNode?.metrics?.scratch_share_users ?? 0;
  const shareSuccess = shareNode?.metrics?.share_success ?? 0;
  const shareCancel = shareNode?.metrics?.share_cancel ?? 0;
  const shareFail = shareNode?.metrics?.share_fail ?? 0;
  const shareRate = shareNode?.metrics?.share_rate ?? 0;
  const shareSuccessRate = shareNode?.metrics?.share_success_rate ?? 0;

  const allShareUsers = referralNode?.metrics?.all_share_users ?? 0;
  const allShareClicks = referralNode?.metrics?.all_share_clicks ?? 0;
  const inviteButton = referralNode?.metrics?.invite_button ?? 0;
  const textInvite = referralNode?.metrics?.text_invite ?? 0;
  const snapchatInvite = referralNode?.metrics?.snapchat_invite ?? 0;
  const shareLink = referralNode?.metrics?.share_link ?? 0;
  const inviteSuccessUsers = referralNode?.metrics?.invite_success_users ?? 0;
  const inviteSuccessEvents = referralNode?.metrics?.invite_success_events ?? 0;
  const landingShow = referralNode?.metrics?.landing_show_users ?? 0;
  const landingClick = referralNode?.metrics?.landing_click_users ?? 0;
  const deeplinkOpen = referralNode?.metrics?.deeplink_open_users ?? 0;
  const inviteSuccessRate = referralNode?.metrics?.invite_success_rate ?? 0;

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold tracking-tight">{t("shareTitle")}</h2>
        <span className="rounded px-1.5 py-0.5 text-[9px] font-medium" style={badgeStyle}>
          {t("lastNDays").replace("{n}", String(analyticsDays))}
        </span>
      </div>
      <p className="mb-4 mt-0.5 text-xs text-[var(--secondary-text)]">{t("shareDesc")}</p>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Scratch → Share */}
        <div className="overflow-visible rounded-xl bg-[var(--card-bg)] p-4" style={cardStyle}>
          <p className="flex items-center text-[11px] font-medium text-[var(--secondary-text)]">
            {t("shareScratchRate")}
            <InfoTooltip metricKey="SHARE_SCRATCH_RATE" />
          </p>
          <p className="mt-2">
            <span className="text-3xl font-semibold tracking-tight text-[var(--foreground)]">{shareRate}%</span>
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg p-2.5" style={{ backgroundColor: "var(--background)" }}>
              <p className="flex items-center text-[10px] text-[var(--secondary-text)]">
                {t("shareScratchUsers")}
                <InfoTooltip metricKey="SHARE_SCRATCH_USERS" />
              </p>
              <p className="mt-0.5 text-base font-semibold text-[var(--foreground)]">{scratchShareUsers.toLocaleString()}</p>
            </div>
            <div className="rounded-lg p-2.5" style={{ backgroundColor: "var(--background)" }}>
              <p className="flex items-center text-[10px] text-[var(--secondary-text)]">
                {t("shareSuccess")} / {t("shareCancel")} / {t("shareFail")}
                <InfoTooltip metricKey="SHARE_SUCCESS" />
              </p>
              <p className="mt-0.5 text-base font-semibold text-[var(--foreground)]">{shareSuccess} / {shareCancel} / {shareFail}</p>
              <p className="text-[9px] text-[var(--secondary-text)]">{shareSuccessRate}% {t("shareSuccessRate")}</p>
            </div>
          </div>
        </div>

        {/* Invite Funnel: clicks → methods → success */}
        <div className="col-span-1 lg:col-span-2 overflow-visible rounded-xl bg-[var(--card-bg)] p-4" style={cardStyle}>
          <p className="flex items-center text-[11px] font-medium text-[var(--secondary-text)]">
            {t("shareInviteClicks")}
            <InfoTooltip metricKey="SHARE_INVITE_CLICKS" />
          </p>
          <p className="mt-1">
            <span className="text-3xl font-semibold tracking-tight text-[var(--foreground)]">{allShareUsers.toLocaleString()}</span>
            <span className="ml-2 text-xs text-[var(--secondary-text)]">{allShareClicks.toLocaleString()} clicks</span>
          </p>

          {/* Method breakdown */}
          <div className="mt-3 grid grid-cols-4 gap-2">
            {[
              { label: "Invite Button", value: inviteButton },
              { label: "Via Text", value: textInvite },
              { label: "Snapchat", value: snapchatInvite },
              { label: "Share Link", value: shareLink },
            ].map((m) => (
              <div key={m.label} className="rounded-lg p-2" style={{ backgroundColor: "var(--background)" }}>
                <p className="text-[9px] text-[var(--secondary-text)]">{m.label}</p>
                <p className="text-sm font-semibold text-[var(--foreground)]">{m.value.toLocaleString()}</p>
              </div>
            ))}
          </div>

          {/* Success + receiving side */}
          <div className="mt-3 grid grid-cols-4 gap-2">
            <div className="rounded-lg p-2" style={{ backgroundColor: "var(--background)" }}>
              <p className="flex items-center text-[9px] text-[var(--secondary-text)]">
                {t("shareInviteSent")}
                <InfoTooltip metricKey="SHARE_INVITE_SENT" />
              </p>
              <p className="text-sm font-semibold text-[var(--foreground)]">{inviteSuccessUsers.toLocaleString()}</p>
              <p className="text-[8px] text-[var(--secondary-text)]">{inviteSuccessEvents.toLocaleString()} events / {inviteSuccessRate}%</p>
            </div>
            <div className="rounded-lg p-2" style={{ backgroundColor: "var(--background)" }}>
              <p className="flex items-center text-[9px] text-[var(--secondary-text)]">
                {t("shareLandingShow")}
                <InfoTooltip metricKey="FW_LANDING_SHOW" />
              </p>
              <p className="text-sm font-semibold text-[var(--foreground)]">{landingShow.toLocaleString()}</p>
            </div>
            <div className="rounded-lg p-2" style={{ backgroundColor: "var(--background)" }}>
              <p className="flex items-center text-[9px] text-[var(--secondary-text)]">
                {t("shareLandingClick")}
                <InfoTooltip metricKey="FW_LANDING_CLICK" />
              </p>
              <p className="text-sm font-semibold text-[var(--foreground)]">{landingClick.toLocaleString()}</p>
            </div>
            <div className="rounded-lg p-2" style={{ backgroundColor: "var(--background)" }}>
              <p className="flex items-center text-[9px] text-[var(--secondary-text)]">
                {t("shareDeeplinkOpen")}
                <InfoTooltip metricKey="FW_DEEPLINK_OPEN" />
              </p>
              <p className="text-sm font-semibold text-[var(--foreground)]">{deeplinkOpen.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
