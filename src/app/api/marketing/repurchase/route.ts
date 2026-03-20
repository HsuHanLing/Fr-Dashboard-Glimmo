import { NextResponse } from "next/server";
import { bigquery } from "@/lib/bigquery";
import { getRepurchaseQuery } from "@/lib/queries";
import { runCachedBigQuery } from "@/lib/marketing-cache";

export const dynamic = "force-dynamic";

const EMPTY_REPURCHASE = {
  total_purchase_users: 0,
  repurchasers: 0,
  repurchase_rate_pct: 0,
  avg_days_to_repurchase: 0,
  repurchase_rate_7d_pct: 0,
  repurchase_rate_30d_pct: 0,
  eligible_first_for_7d: 0,
  eligible_first_for_30d: 0,
  daily: [] as { date: string; first_purchase_users: number; second_purchase_users: number }[],
  platform_breakdown: [] as { platform: string; total_users: number; repurchasers: number; repurchase_rate_pct: number }[],
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = Math.min(parseInt(searchParams.get("days") || "30", 10), 90);

  try {
    const rows = await runCachedBigQuery<Record<string, unknown>>(
      ["marketing-repurchase", String(days)],
      getRepurchaseQuery(days)
    );
    const rep = rows[0] || {};
    const pct = (v: unknown) => Math.round(Number(v ?? 0) * 100000) / 1000;
    type DailyRow = { date: string; first_purchase_users: number; second_purchase_users: number };
    type PlatRow = { platform: string; total_users: number; repurchasers: number; repurchase_rate: number };
    const dailyRaw = (rep.daily_data as DailyRow[] | null | undefined) ?? [];
    const daily = dailyRaw.map((d) => ({
      date: String(d.date ?? ""),
      first_purchase_users: Number(d.first_purchase_users ?? 0),
      second_purchase_users: Number(d.second_purchase_users ?? 0),
    }));
    const platRaw = (rep.platform_breakdown as PlatRow[] | null | undefined) ?? [];
    const platform_breakdown = platRaw.map((p) => ({
      platform: String(p.platform ?? "unknown"),
      total_users: Number(p.total_users ?? 0),
      repurchasers: Number(p.repurchasers ?? 0),
      repurchase_rate_pct: pct(p.repurchase_rate),
    }));

    return NextResponse.json({
      total_purchase_users: Number(rep.total_purchase_users ?? 0),
      repurchasers: Number(rep.repurchasers ?? 0),
      repurchase_rate_pct: pct(rep.repurchase_rate),
      avg_days_to_repurchase:
        rep.avg_days_to_repurchase != null ? Math.round(Number(rep.avg_days_to_repurchase) * 10) / 10 : 0,
      repurchase_rate_7d_pct: pct(rep.repurchase_rate_7d),
      repurchase_rate_30d_pct: pct(rep.repurchase_rate_30d),
      eligible_first_for_7d: Number(rep.eligible_first_for_7d ?? 0),
      eligible_first_for_30d: Number(rep.eligible_first_for_30d ?? 0),
      daily,
      platform_breakdown,
    });
  } catch (error) {
    console.error("BigQuery repurchase error:", error);
    return NextResponse.json(EMPTY_REPURCHASE);
  }
}
