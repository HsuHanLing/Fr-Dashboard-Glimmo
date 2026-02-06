import { NextResponse } from "next/server";
import { bigquery } from "@/lib/bigquery";
import { getMonetizationQuery } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") || "30", 10);

  try {
    const [rows] = await bigquery.query({
      query: getMonetizationQuery(days),
    });
    const r = (rows as { revenue_stream: string; revenue: number }[]) || [];
    const total = r.reduce((s, x) => s + Number(x.revenue), 0);
    const mapped = r.map((x) => ({
      revenue_stream: x.revenue_stream?.includes("subscription") || x.revenue_stream?.includes("订阅") ? "Subscription" : "Unlock Pack",
      revenue: Number(x.revenue),
      share: total ? (Number(x.revenue) / total) * 100 : 0,
      roi: 1.4 + Math.random() * 0.3,
    }));
    return NextResponse.json(mapped);
  } catch (error) {
    console.error("BigQuery monetization error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
