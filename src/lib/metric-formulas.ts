/**
 * Metric definitions and formulas shown on hover.
 */

export const METRIC_FORMULAS: Record<string, { formula: string; description: string }> = {
  DAU: {
    formula: "COUNT(DISTINCT user_pseudo_id) per day",
    description: "Daily Active Users: unique users who had at least one session that day.",
  },
  D1_RETENTION: {
    formula: "(Users who returned on D1 / New users on D0) × 100%",
    description: "D1 Retention: % of new users who came back the next day.",
  },
  PAY_RATE: {
    formula: "(Paying users / DAU) × 100%",
    description: "Pay Rate: % of daily active users who made a purchase.",
  },
  ARPPU: {
    formula: "Total Revenue / Paying users",
    description: "Average Revenue Per Paying User.",
  },
  REVENUE: {
    formula: "SUM(event_value_in_usd) where event_name IN ('purchase','in_app_purchase')",
    description: "Total revenue from in-app purchases.",
  },
  WITHDRAWAL: {
    formula: "SUM(withdrawal events) or configurable % of revenue",
    description: "Total withdrawal amount (user payouts).",
  },
  ROI: {
    formula: "Revenue / Cost (or Revenue / Spend)",
    description: "Return on Investment.",
  },
  NEW: {
    formula: "COUNT(DISTINCT user_pseudo_id) where event_name = 'first_open'",
    description: "New users: first-time app opens.",
  },
  UNLOCK_USERS: {
    formula: "COUNT(DISTINCT user_pseudo_id) with unlock-type events",
    description: "Users who triggered at least one unlock event.",
  },
  UNLOCK_GE2: {
    formula: "COUNT(DISTINCT user_pseudo_id) with ≥2 unlock events",
    description: "High-freq unlock users: 2+ unlock actions.",
  },
  PAYERS: {
    formula: "COUNT(DISTINCT user_pseudo_id) with purchase event",
    description: "Unique paying users per day.",
  },
  // Growth Funnel (7d signup cohort)
  FUNNEL_SIGNUP: {
    formula: "COUNT(DISTINCT user_pseudo_id) WHERE event_name = 'first_open'",
    description: "7d signup cohort: users with first_open in window.",
  },
  FUNNEL_ACTIVATION: {
    formula: "COUNT(DISTINCT user_pseudo_id) WHERE event_name = 'session_start' after signup",
    description: "Users who had at least one session after registration.",
  },
  FUNNEL_FIRST_SUP: {
    formula: "COUNT(DISTINCT user_pseudo_id) WHERE event_name = 'Click_Sup' AND feed_area NOT LIKE '%$UP%'",
    description: "First SUP: first Click_Sup on non-$UP feed area.",
  },
  FUNNEL_FIRST_UP: {
    formula: "COUNT(DISTINCT user_pseudo_id) WHERE event_name = 'Click_Sup' AND feed_area LIKE '%$UP%'",
    description: "First $UP: first Click_Sup on $UP feed area. Parallel branch with First SUP.",
  },
  FUNNEL_FIRST_UNLOCK: {
    formula: "COUNT(DISTINCT user_pseudo_id) WHERE event_name IN ('switch_Watermark','unlock','Unlock_Sup') OR event_name LIKE '%unlock%'",
    description: "Users who triggered first unlock event.",
  },
  FUNNEL_FIRST_PAY: {
    formula: "COUNT(DISTINCT user_pseudo_id) WHERE event_name IN ('purchase','in_app_purchase')",
    description: "Users who made first purchase.",
  },
  FUNNEL_CONVERSION: {
    formula: "(Users at step / Signup users) × 100%",
    description: "Conversion rate vs. signup cohort base.",
  },
  // Retention (cohort by signup)
  RETENTION_D1: {
    formula: "(Users who returned on day 1 / New users on D0) × 100%",
    description: "D1 retention: % of cohort who had activity 1 day after signup.",
  },
  RETENTION_D3: {
    formula: "(Users who returned on day 3 / New users on D0) × 100%",
    description: "D3 retention: % of cohort who had activity 3 days after signup.",
  },
  RETENTION_D7: {
    formula: "(Users who returned on day 7 / New users on D0) × 100%",
    description: "D7 retention: % of cohort who had activity 7 days after signup.",
  },
  RETENTION_D14: {
    formula: "(Users who returned on day 14 / New users on D0) × 100%",
    description: "D14 retention: % of cohort who had activity 14 days after signup.",
  },
  RETENTION_WOW: {
    formula: "Week-over-week change vs. same day in prior week",
    description: "WoW: (Current week rate − Prior week rate).",
  },
};
