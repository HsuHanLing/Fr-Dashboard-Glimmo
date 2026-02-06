import { NextResponse } from "next/server";
import { bigquery } from "@/lib/bigquery";
import { getRetentionQuery } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") || "30", 10);

  try {
    const [rows] = await bigquery.query({
      query: getRetentionQuery(days),
    });
    const r = (rows as { day_num: number; rate: number }[]) || [];
    const chart = r.map((x) => ({
      day: `D${x.day_num}`,
      rate: Number(x.rate ?? 0),
      wow: 0, // WoW requires prior period query; placeholder
    }));
    return NextResponse.json({ chart });
  } catch (error) {
    console.error("BigQuery retention error:", error);
    return NextResponse.json({ chart: [] }, { status: 500 });
  }
}
