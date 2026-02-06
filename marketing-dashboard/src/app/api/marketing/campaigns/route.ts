import { NextResponse } from "next/server";
import { bigquery } from "@/lib/bigquery";
import { getCampaignsQuery } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") || "30", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);

  try {
    const [rows] = await bigquery.query({
      query: getCampaignsQuery(days, limit),
    });
    const data = (rows as Record<string, unknown>[]).map((r) => ({
      campaign: String(r.campaign ?? "Unnamed"),
      spend: 0,
      impressions: Number(r.impressions ?? 0),
      clicks: Number(r.clicks ?? 0),
      sessions: Number(r.sessions ?? 0),
      revenue: Number(r.revenue ?? 0),
    }));
    return NextResponse.json(data);
  } catch (error) {
    console.error("BigQuery campaigns error:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaigns", details: String(error) },
      { status: 500 }
    );
  }
}
