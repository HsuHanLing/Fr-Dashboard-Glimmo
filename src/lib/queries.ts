/**
 * BigQuery queries for GA4 events (custom event names).
 * Events: screen_view, Click_Sup, user_engagement, Open_app, session_start, etc.
 */

const dataset = () => process.env.BIGQUERY_DATASET || "analytics_233462855";
const table = () => process.env.BIGQUERY_TABLE || "events_*";

function tableFilter(days: number) {
  return `_TABLE_SUFFIX BETWEEN FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL ${days} DAY))
      AND FORMAT_DATE('%Y%m%d', CURRENT_DATE())
      AND PARSE_DATE('%Y%m%d', event_date) >= DATE_SUB(CURRENT_DATE(), INTERVAL ${days} DAY)`;
}

// Custom event mapping from your data
const EVENTS = {
  impressions: "event_name = 'screen_view' OR event_name = 'All_PageBehavior'",
  clicks: "event_name = 'Click_Sup'",
  engagement: "event_name = 'user_engagement' OR event_name = 'LongPress_Sup'",
  appOpens: "event_name = 'Open_app'",
  sessions: "event_name = 'session_start'",
  conversions: "event_name = 'purchase' OR event_name = 'conversion' OR event_name = 'first_open'",
};

export function getOverviewQuery(days: number = 30) {
  return `
    SELECT
      COUNTIF(${EVENTS.impressions}) as total_impressions,
      COUNTIF(${EVENTS.clicks}) as total_clicks,
      COUNTIF(${EVENTS.engagement}) as total_engagement,
      COUNTIF(${EVENTS.appOpens}) as total_app_opens,
      COUNTIF(${EVENTS.sessions}) as total_sessions,
      COUNTIF(${EVENTS.conversions}) as total_conversions,
      COALESCE(SUM(event_value_in_usd), 0) as total_revenue
    FROM \`${dataset()}.${table()}\`
    WHERE ${tableFilter(days)}
  `;
}

export function getTrendsQuery(days: number = 30) {
  return `
    SELECT
      FORMAT_DATE('%Y-%m-%d', PARSE_DATE('%Y%m%d', event_date)) as date,
      COUNTIF(${EVENTS.impressions}) as impressions,
      COUNTIF(${EVENTS.clicks}) as clicks,
      COUNTIF(${EVENTS.engagement}) as engagement,
      COUNTIF(${EVENTS.appOpens}) as app_opens,
      COUNTIF(${EVENTS.sessions}) as sessions,
      COALESCE(SUM(event_value_in_usd), 0) as revenue
    FROM \`${dataset()}.${table()}\`
    WHERE ${tableFilter(days)}
    GROUP BY event_date
    ORDER BY event_date ASC
  `;
}

export function getTopEventsQuery(days: number = 30, limit: number = 15) {
  return `
    SELECT event_name as event, COUNT(*) as count
    FROM \`${dataset()}.${table()}\`
    WHERE ${tableFilter(days)}
    GROUP BY event_name
    ORDER BY count DESC
    LIMIT ${limit}
  `;
}

export function getChannelPerformanceQuery(days: number = 30) {
  return `
    SELECT
      COALESCE(traffic_source.source, '(direct)') as channel,
      COUNTIF(${EVENTS.impressions}) as impressions,
      COUNTIF(${EVENTS.clicks}) as clicks,
      COUNTIF(${EVENTS.sessions}) as sessions,
      COALESCE(SUM(event_value_in_usd), 0) as revenue
    FROM \`${dataset()}.${table()}\`
    WHERE ${tableFilter(days)}
    GROUP BY traffic_source.source
    ORDER BY sessions DESC
  `;
}

export function getCampaignsQuery(days: number = 30, limit: number = 20) {
  return `
    SELECT
      COALESCE(traffic_source.name, '(not set)') as campaign,
      COUNTIF(${EVENTS.impressions}) as impressions,
      COUNTIF(${EVENTS.clicks}) as clicks,
      COUNTIF(${EVENTS.sessions}) as sessions,
      COALESCE(SUM(event_value_in_usd), 0) as revenue
    FROM \`${dataset()}.${table()}\`
    WHERE ${tableFilter(days)}
    GROUP BY traffic_source.name
    ORDER BY sessions DESC
    LIMIT ${limit}
  `;
}

// KPI & Daily Trend - uses same tableFilter as daily-trend for consistency
export function getKPIAndWowQuery(mode: "today" | "7d" | "30d") {
  const days = mode === "today" ? 8 : mode === "7d" ? 14 : 60;
  return `
    WITH daily AS (
      SELECT
        FORMAT_DATE('%Y-%m-%d', PARSE_DATE('%Y%m%d', event_date)) as date_str,
        PARSE_DATE('%Y%m%d', event_date) as dt,
        COUNT(DISTINCT user_pseudo_id) as dau,
        COUNT(DISTINCT CASE WHEN event_name = 'first_open' THEN user_pseudo_id END) as new_users,
        COUNT(DISTINCT CASE WHEN event_name IN ('purchase','in_app_purchase') THEN user_pseudo_id END) as payers,
        COALESCE(SUM(CASE WHEN event_name IN ('purchase','in_app_purchase') THEN event_value_in_usd END), 0) as revenue,
        COUNT(DISTINCT CASE WHEN event_name IN ('switch_Watermark','unlock','Unlock_Sup') OR event_name LIKE '%unlock%' THEN user_pseudo_id END) as unlock_users
      FROM \`${dataset()}.${table()}\`
      WHERE ${tableFilter(days)}
      GROUP BY 1, 2
    ),
    d1_cohort AS (
      SELECT
        FORMAT_DATE('%Y-%m-%d', DATE_ADD(s.signup_dt, INTERVAL 1 DAY)) as return_date,
        COUNT(DISTINCT s.user_pseudo_id) as retained_d1
      FROM (
        SELECT user_pseudo_id, MIN(PARSE_DATE('%Y%m%d', event_date)) as signup_dt
        FROM \`${dataset()}.${table()}\`
        WHERE ${tableFilter(days)} AND event_name = 'first_open'
        GROUP BY 1
      ) s
      JOIN \`${dataset()}.${table()}\` b
        ON s.user_pseudo_id = b.user_pseudo_id
        AND PARSE_DATE('%Y%m%d', b.event_date) = DATE_ADD(s.signup_dt, INTERVAL 1 DAY)
      WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL ${days} DAY))
        AND PARSE_DATE('%Y%m%d', b.event_date) >= DATE_SUB(CURRENT_DATE(), INTERVAL ${days} DAY)
      GROUP BY 1
    )
    SELECT
      d.date_str,
      d.dt,
      d.dau,
      d.new_users,
      d.payers,
      d.revenue,
      d.unlock_users,
      c.retained_d1,
      LAG(d.new_users) OVER (ORDER BY d.dt) as prev_day_new_users
    FROM daily d
    LEFT JOIN d1_cohort c ON c.return_date = d.date_str
    ORDER BY d.dt DESC
  `;
}

export function getDailyTrendQuery(days: number = 7) {
  return `
    SELECT
      FORMAT_DATE('%Y-%m-%d', PARSE_DATE('%Y%m%d', event_date)) as date,
      COUNT(DISTINCT CASE WHEN event_name = 'first_open' THEN user_pseudo_id END) as new_users,
      COUNT(DISTINCT user_pseudo_id) as dau,
      COUNT(DISTINCT CASE WHEN event_name IN ('purchase','in_app_purchase') THEN user_pseudo_id END) as payers,
      COALESCE(SUM(CASE WHEN event_name IN ('purchase','in_app_purchase') THEN event_value_in_usd END), 0) as revenue,
      COUNT(DISTINCT CASE WHEN event_name IN ('switch_Watermark','unlock','Unlock_Sup') OR event_name LIKE '%unlock%' THEN user_pseudo_id END) as unlock_users
    FROM \`${dataset()}.${table()}\`
    WHERE ${tableFilter(days)}
    GROUP BY event_date
    ORDER BY event_date ASC
  `;
}

// User Attributes - Age & Device (user_profile, device_info)
export function getUserAttributesQuery(days: number = 30) {
  return `
    WITH device_agg AS (
      SELECT platform as device_type, COUNT(DISTINCT user_pseudo_id) as users
      FROM \`${dataset()}.${table()}\`
      WHERE ${tableFilter(days)}
      GROUP BY platform
    ),
    age_agg AS (
      SELECT
        COALESCE(
          (SELECT value.string_value FROM UNNEST(user_properties) WHERE key = 'age_group'),
          '35+'
        ) as age_group,
        COUNT(DISTINCT user_pseudo_id) as users
      FROM \`${dataset()}.${table()}\`
      WHERE ${tableFilter(days)}
      GROUP BY 1
    )
    SELECT 'device' as type, device_type as attr, users FROM device_agg
    UNION ALL
    SELECT 'age' as type, age_group as attr, users FROM age_agg
  `;
}

// Geographic Distribution (user_geo_info)
export function getGeoDistributionQuery(days: number = 30) {
  return `
    SELECT
      COALESCE(geo.country, 'Unknown') as region,
      COUNT(DISTINCT user_pseudo_id) as users
    FROM \`${dataset()}.${table()}\`
    WHERE ${tableFilter(days)} AND geo.country IS NOT NULL
    GROUP BY geo.country
    ORDER BY users DESC
    LIMIT 15
  `;
}

// Monetization - Revenue Mix (rev_mix, roi_by_channel)
export function getMonetizationQuery(days: number = 30) {
  return `
    SELECT
      COALESCE(
        (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'product_type'),
        (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'item_category'),
        'Unlock Pack'
      ) as revenue_stream,
      SUM(event_value_in_usd) as revenue
    FROM \`${dataset()}.${table()}\`
    WHERE ${tableFilter(days)}
      AND event_name IN ('purchase', 'in_app_purchase')
      AND event_value_in_usd > 0
    GROUP BY 1
    ORDER BY revenue DESC
  `;
}

// Economy Health (economy_flow)
export function getEconomyHealthQuery(days: number = 30) {
  return `
    WITH unlock_ct AS (
      SELECT COUNT(*) as cnt FROM \`${dataset()}.${table()}\`
      WHERE ${tableFilter(days)} AND (event_name LIKE '%unlock%' OR event_name = 'switch_Watermark')
    ),
    scratch_ct AS (
      SELECT COUNT(*) as cnt FROM \`${dataset()}.${table()}\`
      WHERE ${tableFilter(days)} AND event_name LIKE '%scratch%'
    ),
    upgrade_ct AS (
      SELECT COUNT(*) as cnt FROM \`${dataset()}.${table()}\`
      WHERE ${tableFilter(days)} AND event_name LIKE '%upgrade%'
    )
    SELECT 'unlock' as metric, (SELECT cnt FROM unlock_ct) as value
    UNION ALL SELECT 'scratch', (SELECT cnt FROM scratch_ct)
    UNION ALL SELECT 'upgrade', (SELECT cnt FROM upgrade_ct)
  `;
}

// Content & Feed Performance (feed_impression, feed_click, video_complete, feature_card_type)
export function getContentFeedQuery(days: number = 30) {
  return `
    WITH feed_areas AS (
      SELECT
        COALESCE(
          (SELECT value.string_value FROM UNNEST(e.event_params) WHERE key = 'feed_area'),
          (SELECT value.string_value FROM UNNEST(e.event_params) WHERE key = 'firebase_screen'),
          'ForYou'
        ) as area,
        COUNTIF(e.event_name IN ('screen_view', 'All_PageBehavior')) as impressions,
        COUNTIF(e.event_name = 'Click_Sup' OR e.event_name LIKE '%click%') as clicks,
        COUNT(DISTINCT e.user_pseudo_id) as users
      FROM \`${dataset()}.${table()}\` e
      WHERE ${tableFilter(days)}
      GROUP BY 1
    )
    SELECT area, impressions, clicks, users,
      SAFE_DIVIDE(clicks, NULLIF(impressions, 0)) * 100 as ctr
    FROM feed_areas
    WHERE impressions > 0
    ORDER BY impressions DESC
    LIMIT 20
  `;
}

// Growth Funnel: signup → activation → first SUP / first $UP → first unlock → first pay
// Uses 7-day signup cohort; steps are based on first occurrence per user
export function getGrowthFunnelQuery(days: number = 7) {
  return `
    WITH base AS (
      SELECT user_pseudo_id, event_date, event_name, event_timestamp,
        (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'feed_area') as feed_area
      FROM \`${dataset()}.${table()}\`
      WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL ${days + 14} DAY))
        AND PARSE_DATE('%Y%m%d', event_date) >= DATE_SUB(CURRENT_DATE(), INTERVAL ${days + 14} DAY)
    ),
    signups AS (
      SELECT user_pseudo_id, MIN(PARSE_DATE('%Y%m%d', event_date)) as signup_dt
      FROM base WHERE event_name = 'first_open'
      GROUP BY 1
      HAVING signup_dt >= DATE_SUB(CURRENT_DATE(), INTERVAL ${days} DAY)
    ),
    first_events AS (
      SELECT
        s.user_pseudo_id,
        MIN(CASE WHEN b.event_name = 'session_start' THEN b.event_date END) as first_session,
        MIN(CASE WHEN b.event_name = 'Click_Sup' AND (b.feed_area IS NULL OR b.feed_area NOT LIKE '%$UP%') THEN b.event_date END) as first_sup,
        MIN(CASE WHEN b.event_name = 'Click_Sup' AND b.feed_area LIKE '%$UP%' THEN b.event_date END) as first_up,
        MIN(CASE WHEN b.event_name IN ('switch_Watermark','unlock','Unlock_Sup') OR b.event_name LIKE '%unlock%' THEN b.event_date END) as first_unlock,
        MIN(CASE WHEN b.event_name IN ('purchase','in_app_purchase') THEN b.event_date END) as first_pay
      FROM signups s
      JOIN base b ON s.user_pseudo_id = b.user_pseudo_id AND PARSE_DATE('%Y%m%d', b.event_date) >= s.signup_dt
      GROUP BY 1
    )
    SELECT 'signup' as step, COUNT(*) as users FROM signups
    UNION ALL SELECT 'activation', COUNT(*) FROM first_events WHERE first_session IS NOT NULL
    UNION ALL SELECT 'first_sup', COUNT(*) FROM first_events WHERE first_sup IS NOT NULL
    UNION ALL SELECT 'first_up', COUNT(*) FROM first_events WHERE first_up IS NOT NULL
    UNION ALL SELECT 'first_unlock', COUNT(*) FROM first_events WHERE first_unlock IS NOT NULL
    UNION ALL SELECT 'first_pay', COUNT(*) FROM first_events WHERE first_pay IS NOT NULL
    ORDER BY CASE step
      WHEN 'signup' THEN 1 WHEN 'activation' THEN 2 WHEN 'first_sup' THEN 3
      WHEN 'first_up' THEN 4 WHEN 'first_unlock' THEN 5 WHEN 'first_pay' THEN 6 ELSE 7 END
  `;
}

// Retention: D1/D3/D7/D14 by signup cohort
export function getRetentionQuery(days: number = 30) {
  return `
    WITH signups AS (
      SELECT user_pseudo_id, MIN(PARSE_DATE('%Y%m%d', event_date)) as signup_dt
      FROM \`${dataset()}.${table()}\`
      WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL ${days + 14} DAY))
        AND PARSE_DATE('%Y%m%d', event_date) >= DATE_SUB(CURRENT_DATE(), INTERVAL ${days + 14} DAY)
        AND event_name = 'first_open'
      GROUP BY 1
      HAVING signup_dt >= DATE_SUB(CURRENT_DATE(), INTERVAL ${days} DAY)
    ),
    activity AS (
      SELECT s.user_pseudo_id, s.signup_dt, b.event_date,
        DATE_DIFF(PARSE_DATE('%Y%m%d', b.event_date), s.signup_dt, DAY) as day_num
      FROM signups s
      JOIN \`${dataset()}.${table()}\` b
        ON s.user_pseudo_id = b.user_pseudo_id
        AND PARSE_DATE('%Y%m%d', b.event_date) > s.signup_dt
        AND PARSE_DATE('%Y%m%d', b.event_date) <= DATE_ADD(s.signup_dt, INTERVAL 14 DAY)
      WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL ${days + 14} DAY))
        AND PARSE_DATE('%Y%m%d', b.event_date) >= DATE_SUB(CURRENT_DATE(), INTERVAL ${days + 14} DAY)
      GROUP BY 1, 2, 3, 4
    ),
    retained AS (
      SELECT day_num, COUNT(DISTINCT user_pseudo_id) as cnt
      FROM activity WHERE day_num IN (1, 3, 7, 14)
      GROUP BY 1
    ),
    total_signups AS (SELECT COUNT(*) as n FROM signups)
    SELECT
      retained.day_num,
      retained.cnt as retained_users,
      ROUND(100.0 * retained.cnt / NULLIF((SELECT n FROM total_signups), 0), 1) as rate
    FROM retained
    ORDER BY retained.day_num
  `;
}

// Creator & Supply (KOL vs Regular)
export function getCreatorSupplyQuery(days: number = 30) {
  return `
    WITH creator_earnings AS (
      SELECT
        COALESCE(
          (SELECT value.string_value FROM UNNEST(event_params) WHERE key = 'creator_type'),
          'regular'
        ) as creator_type,
        SUM(event_value_in_usd) as earnings
      FROM \`${dataset()}.${table()}\`
      WHERE ${tableFilter(days)}
        AND event_name IN ('creator_earnings', 'withdrawal_request', 'unlock_event')
      GROUP BY 1
    )
    SELECT creator_type, earnings FROM creator_earnings
    ORDER BY earnings DESC
  `;
}
