import { NextResponse } from "next/server";
import { bigquery } from "@/lib/bigquery";
import { getReferralRewardQuery } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = Math.min(parseInt(searchParams.get("days") || "30", 10), 90);

  try {
    const [rows] = await bigquery.query({ query: getReferralRewardQuery(days) });
    const r = (rows as Record<string, unknown>[])[0] || {};
    const n = (v: unknown) => Number(v ?? 0);

    const inviteAttemptUsers = n(r.invite_attempt_users);
    const inviteAttemptEvents = n(r.invite_attempt_events);
    const inviteSentUsers = n(r.invite_sent_users);
    const inviteSentEvents = n(r.invite_sent_events);
    const landingViews = n(r.landing_views);
    const landingNewVisitors = n(r.landing_new_visitors);
    const landingClicks = n(r.landing_clicks);
    const deeplinkOpens = n(r.deeplink_opens);
    const referralRegistrations = n(r.referral_registrations);

    const pct = (a: number, b: number) => b > 0 ? Math.round((a / b) * 1000) / 10 : 0;

    const funnel = [
      { step: "invite_attempt", label: "Invite Attempts", users: inviteAttemptUsers, events: inviteAttemptEvents },
      { step: "invite_sent", label: "Invite Sent", users: inviteSentUsers, events: inviteSentEvents },
      { step: "landing_view", label: "Landing Page Views", users: landingViews, sub: `${landingNewVisitors} new visitors` },
      { step: "landing_click", label: "Landing Click-through", users: landingClicks },
      { step: "deeplink_open", label: "App Opened via Link", users: deeplinkOpens },
      { step: "referral_reg", label: "Referral Registrations", users: referralRegistrations },
    ];

    const dailyData = Array.isArray(r.daily_data)
      ? (r.daily_data as Record<string, unknown>[]).map((d) => ({
          date: String(d.date),
          invite_users: n(d.daily_invite_users),
          sent_users: n(d.daily_sent_users),
          landing_users: n(d.daily_landing_users),
          open_users: n(d.daily_open_users),
        }))
      : [];

    return NextResponse.json({
      funnel,
      dailyData,
      summary: {
        invite_to_sent_rate: pct(inviteSentUsers, inviteAttemptUsers),
        landing_to_click_rate: pct(landingClicks, landingViews),
        click_to_open_rate: pct(deeplinkOpens, landingClicks),
        overall_conversion: pct(referralRegistrations, inviteAttemptUsers),
      },
      days,
    });
  } catch (error) {
    console.error("Referral reward query error:", error);
    return NextResponse.json({ funnel: [], dailyData: [], summary: {}, days, error: String(error) });
  }
}
