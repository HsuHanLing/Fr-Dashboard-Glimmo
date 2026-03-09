import { NextResponse } from "next/server";
import { bigquery } from "@/lib/bigquery";
import { getRegistrationFunnelQuery } from "@/lib/queries";

export const dynamic = "force-dynamic";

const MAIN_FUNNEL_STEPS = [
  "app_open",
  "app_open_no_action",
  "auth_entry_click",
  "click_signup",
  "registered",
  "enter_main",
] as const;

const CHANNEL_KEYS = ["google", "apple", "email", "phone"] as const;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") || "30", 10);

  try {
    const [rows] = await bigquery.query({
      query: getRegistrationFunnelQuery(days),
    });
    const raw = (rows as { step: string; users: number }[]) || [];
    const mainRows = raw.filter((r) => !r.step?.startsWith("country_"));
    const countryRows = raw.filter((r) => r.step?.startsWith("country_"));
    const map = Object.fromEntries(mainRows.map((r) => [r.step, Number(r.users ?? 0)]));

    const appOpen = map["app_open"] ?? 0;

    const channelsByCountry: Record<string, { google: number; apple: number; email: number; phone: number }> = {};
    for (const r of countryRows) {
      const match = r.step?.match(/^country_(.+)_(google|apple|email|phone)$/);
      if (match) {
        const [, country, channel] = match;
        if (!channelsByCountry[country]) channelsByCountry[country] = { google: 0, apple: 0, email: 0, phone: 0 };
        channelsByCountry[country][channel as keyof typeof channelsByCountry[string]] = Number(r.users ?? 0);
      }
    }

    const funnel = MAIN_FUNNEL_STEPS.map((step) => ({
      step,
      users: map[step] ?? 0,
      fromTop: appOpen > 0 ? Math.round(((map[step] ?? 0) / appOpen) * 1000) / 10 : 0,
    }));

    const channels = CHANNEL_KEYS.map((ch) => {
      const clicked = map[`click_${ch}`] ?? 0;
      const success = map[`reg_${ch}`] ?? 0;
      return {
        channel: ch,
        clicked,
        success,
        failure: Math.max(0, clicked - success),
      };
    });

    const noActionDebug = {
      app_open: appOpen,
      app_open_no_action: map["app_open_no_action"] ?? 0,
      has_auth_entry_click: map["debug_has_auth_entry_click"] ?? 0,
      has_auth_nickname_next: map["debug_has_auth_nickname_next"] ?? 0,
      has_auth_submit_result: map["debug_has_auth_submit_result"] ?? 0,
      has_auth_oauth_or_switch: map["debug_has_auth_oauth_or_switch"] ?? 0,
      has_legacy_success: map["debug_has_legacy_success"] ?? 0,
      has_reg: map["debug_has_reg"] ?? 0,
      has_click_signup: map["click_signup"] ?? 0,
      has_enter_main: map["enter_main"] ?? 0,
      has_click_google: map["click_google"] ?? 0,
      has_click_apple: map["click_apple"] ?? 0,
      has_click_email: map["click_email"] ?? 0,
      has_click_phone: map["click_phone"] ?? 0,
      has_reg_google: map["reg_google"] ?? 0,
      has_reg_apple: map["reg_apple"] ?? 0,
      has_reg_email: map["reg_email"] ?? 0,
      has_reg_phone: map["reg_phone"] ?? 0,
      has_watch_video: map["debug_has_watch_video"] ?? 0,
      has_add_friend: map["debug_has_add_friend"] ?? 0,
      has_profile_view: map["debug_has_profile_view"] ?? 0,
      has_shooting: map["debug_has_shooting"] ?? 0,
    };

    return NextResponse.json({ funnel, channels, channelsByCountry, noActionDebug }, { status: 200 });
  } catch (error) {
    console.error("BigQuery registration-funnel error:", error);
    return NextResponse.json(
      { funnel: [], channels: [], channelsByCountry: {}, noActionDebug: null },
      { status: 500 }
    );
  }
}
