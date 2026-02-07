import { NextResponse } from "next/server";
import { bigquery } from "@/lib/bigquery";
import { getDailyTrendQuery } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") || "7", 10);
  const channel = searchParams.get("channel") || undefined;
  const version = searchParams.get("version") || undefined;
  const userSegment = searchParams.get("userSegment") || undefined;
  const platform = searchParams.get("platform") || undefined;
  const filters = (channel || version || userSegment || platform) ? { channel, version, userSegment, platform } : undefined;

  try {
    const [rows] = await bigquery.query({ query: getDailyTrendQuery(days, filters) });
    const data = (rows as Record<string, unknown>[]).map((r) => {
      const retainedD1 = Number(r.retained_d1 ?? 0);
      const prevDayNew = Number(r.prev_day_new_users ?? 0);
      const d1Pct = prevDayNew > 0 ? Math.round((retainedD1 / prevDayNew) * 1000) / 10 : null;
      return {
      date: String(r.date),
      new_users: Number(r.new_users ?? 0),
      dau: Number(r.dau ?? 0),
      d1: d1Pct !== null ? `${d1Pct}%` : "—",
      unlock_users: Number(r.unlock_users ?? 0),
      unlock_ge2: Math.round(Number(r.unlock_users ?? 0) * 0.6),
      payers: Number(r.payers ?? 0),
      revenue: Number(r.revenue ?? 0),
      withdrawal: Number((r.revenue ?? 0)) * 0.2,
    };
    });
    return NextResponse.json(data);
  } catch (error) {
    console.error("Daily trend error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
