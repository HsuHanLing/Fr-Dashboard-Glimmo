import { NextResponse } from "next/server";
import { bigquery } from "@/lib/bigquery";
import { getMonetizationQuery } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") || "30", 10);

  try {
    const [rows] = await bigquery.query({ query: getMonetizationQuery(days) });
    const r = (rows as { revenue_stream: string; revenue: number }[]) || [];
    const total = r.reduce((s, x) => s + Number(x.revenue), 0);

    const mapped = r.map((x) => ({
      revenue_stream: x.revenue_stream,
      revenue: Math.round(Number(x.revenue) * 100) / 100,
      share: total > 0 ? Math.round((Number(x.revenue) / total) * 1000) / 10 : 0,
    }));

    return NextResponse.json(mapped);
  } catch (error) {
    console.error("BigQuery monetization error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
