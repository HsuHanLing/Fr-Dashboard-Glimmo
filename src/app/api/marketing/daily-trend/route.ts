import { NextResponse } from "next/server";
import { bigquery } from "@/lib/bigquery";
import { getDailyTrendQuery } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") || "7", 10);

  try {
    const [rows] = await bigquery.query({ query: getDailyTrendQuery(days) });
    const data = (rows as Record<string, unknown>[]).map((r) => ({
      date: String(r.date),
      new_users: Number(r.new_users ?? 0),
      dau: Number(r.dau ?? 0),
      d1: "—",
      unlock_users: Number(r.unlock_users ?? 0),
      unlock_ge2: Math.round(Number(r.unlock_users ?? 0) * 0.6),
      payers: Number(r.payers ?? 0),
      revenue: Number(r.revenue ?? 0),
      withdrawal: Number((r.revenue ?? 0)) * 0.2,
    }));
    return NextResponse.json(data);
  } catch (error) {
    console.error("Daily trend error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
