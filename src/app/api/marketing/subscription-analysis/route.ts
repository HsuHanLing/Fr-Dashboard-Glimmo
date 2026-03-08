import { NextResponse } from "next/server";
import { bigquery } from "@/lib/bigquery";
import { getSubscriptionAnalysisQuery } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = Math.min(parseInt(searchParams.get("days") || "30", 10), 90);

  try {
    const [rows] = await bigquery.query({ query: getSubscriptionAnalysisQuery(days) });
    const r = (rows as Record<string, unknown>[])[0] || {};

    type DailyRow = {
      date: string;
      auto_convert_users: number;
      manual_convert_users: number;
      paid_sub_users: number;
      nonmember_hint_users: number;
      membership_entry_users: number;
      iap_start_users: number;
      iap_fail_users: number;
      topup_start_users: number;
      topup_success_users: number;
    };

    const daily = ((r.daily_data as DailyRow[]) || []).map((d) => ({
      date: d.date,
      exchange: Number(d.auto_convert_users ?? 0) + Number(d.manual_convert_users ?? 0),
      auto_convert: Number(d.auto_convert_users ?? 0),
      manual_convert: Number(d.manual_convert_users ?? 0),
      paid: Number(d.paid_sub_users ?? 0),
      nonmember_hint: Number(d.nonmember_hint_users ?? 0),
      membership_entry: Number(d.membership_entry_users ?? 0),
      iap_start: Number(d.iap_start_users ?? 0),
      iap_fail: Number(d.iap_fail_users ?? 0),
      topup_start: Number(d.topup_start_users ?? 0),
      topup_success: Number(d.topup_success_users ?? 0),
    }));

    const kpi = {
      total_exchange: Number(r.total_exchange_users ?? 0),
      auto_convert: Number(r.total_auto_convert ?? 0),
      manual_convert: Number(r.total_manual_convert ?? 0),
      total_paid: Number(r.total_paid_sub ?? 0),
      paid_revenue: Math.round(Number(r.paid_revenue ?? 0) * 100) / 100,
      nonmember_hint: Number(r.total_nonmember_hint ?? 0),
      membership_entry: Number(r.total_membership_entry ?? 0),
      iap_start: Number(r.total_iap_start ?? 0),
      iap_fail: Number(r.total_iap_fail ?? 0),
      topup_start: Number(r.total_topup_start ?? 0),
      topup_success: Number(r.total_topup_success ?? 0),
    };

    type ConvertMethod = { convert_method: string; conversions: number };
    const convertMethods = ((r.convert_methods as ConvertMethod[]) || []).map((m) => ({
      method: m.convert_method,
      count: Number(m.conversions ?? 0),
    }));

    const funnel = [
      { step: "nonmember_hint", label: "Saw upgrade prompt", users: kpi.nonmember_hint },
      { step: "membership_entry", label: "Clicked membership", users: kpi.membership_entry },
      { step: "exchange", label: "Exchanged (cash/diamond)", users: kpi.total_exchange },
      { step: "iap_start", label: "Started subscription IAP", users: kpi.iap_start },
      { step: "paid", label: "Subscribed (real $)", users: kpi.total_paid },
    ];

    return NextResponse.json({ kpi, daily, funnel, convertMethods });
  } catch (error) {
    console.error("BigQuery subscription-analysis error:", error);
    return NextResponse.json({ kpi: null, daily: [], funnel: [], convertMethods: [] });
  }
}
