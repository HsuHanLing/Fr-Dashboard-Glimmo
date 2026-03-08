import { NextResponse } from "next/server";
import { bigquery } from "@/lib/bigquery";
import { getGrowthFunnelQuery } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30", 10);

  try {
    const [rows] = await bigquery.query({
      query: getGrowthFunnelQuery(days),
    });
    const r = (rows as { step: string; users: number }[]) || [];
    const firstOpenCount = r.find((x) => x.step === "first_open")?.users ?? 0;
    const data = r.map((x) => ({
      step: x.step,
      stepLabel: x.step,
      users: Number(x.users ?? 0),
      conversion: firstOpenCount > 0 ? Math.round((Number(x.users ?? 0) / firstOpenCount) * 1000) / 10 : 0,
    }));
    return NextResponse.json(data);
  } catch (error) {
    console.error("BigQuery growth-funnel error:", error);
    return NextResponse.json([], { status: 500 });
  }
}
