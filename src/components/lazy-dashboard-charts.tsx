"use client";

import dynamic from "next/dynamic";

const load = () => <span className="text-[11px] text-[var(--secondary-text)]">…</span>;

export const DailyTrendChartLazy = dynamic(
  () => import("./DailyTrendChart").then((m) => m.DailyTrendChart),
  { ssr: false, loading: load }
);
export const DailyTrendTableLazy = dynamic(
  () => import("./DailyTrendTable").then((m) => m.DailyTrendTable),
  { ssr: false, loading: load }
);
export const UserAttributesChartLazy = dynamic(
  () => import("./UserAttributesChart").then((m) => m.UserAttributesChart),
  { ssr: false, loading: load }
);
export const GeoDistributionChartLazy = dynamic(
  () => import("./GeoDistributionChart").then((m) => m.GeoDistributionChart),
  { ssr: false, loading: load }
);
export const CreatorSupplyChartLazy = dynamic(
  () => import("./CreatorSupplyChart").then((m) => m.CreatorSupplyChart),
  { ssr: false, loading: load }
);
export const GrowthFunnelChartLazy = dynamic(
  () => import("./GrowthFunnelChart").then((m) => m.GrowthFunnelChart),
  { ssr: false, loading: load }
);
export const RetentionRateChartLazy = dynamic(
  () => import("./RetentionRateChart").then((m) => m.RetentionRateChart),
  { ssr: false, loading: load }
);
export const MonetizationChartLazy = dynamic(
  () => import("./MonetizationChart").then((m) => m.MonetizationChart),
  { ssr: false, loading: load }
);
export const EconomyHealthChartLazy = dynamic(
  () => import("./EconomyHealthChart").then((m) => m.EconomyHealthChart),
  { ssr: false, loading: load }
);
export const ContentFeedChartLazy = dynamic(
  () => import("./ContentFeedChart").then((m) => m.ContentFeedChart),
  { ssr: false, loading: load }
);
export const UnlockInsightsSectionLazy = dynamic(
  () => import("./UnlockInsightsSection").then((m) => m.UnlockInsightsSection),
  { ssr: false, loading: load }
);
export const PaidUsersSectionLazy = dynamic(
  () => import("./PaidUsersSection").then((m) => m.PaidUsersSection),
  { ssr: false, loading: load }
);
export const SubscriptionAnalysisSectionLazy = dynamic(
  () => import("./SubscriptionAnalysisSection").then((m) => m.SubscriptionAnalysisSection),
  { ssr: false, loading: load }
);
export const ScratchRewardWithdrawSectionLazy = dynamic(
  () => import("./ScratchRewardWithdrawSection").then((m) => m.ScratchRewardWithdrawSection),
  { ssr: false, loading: load }
);
