import { NextResponse } from "next/server";
import { bigquery } from "@/lib/bigquery";
import { getRegistrationRelatedEventsQuery } from "@/lib/queries";

export const dynamic = "force-dynamic";

/** Returns event names and firebase_screen values that look registration-related (for funnel mapping) */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") || "30", 10);

  try {
    const [rows] = await bigquery.query({
      query: getRegistrationRelatedEventsQuery(days),
    });
    const data = (rows as { name: string; type: string; cnt: number }[]).map((r) => ({
      name: String(r.name ?? ""),
      type: String(r.type ?? "event"),
      count: Number(r.cnt ?? 0),
    }));
    return NextResponse.json(data);
  } catch (error) {
    console.error("BigQuery registration-events error:", error);
    return NextResponse.json([], { status: 500 });
  }
}
