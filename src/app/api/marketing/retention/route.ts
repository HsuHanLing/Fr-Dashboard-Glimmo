import { NextResponse } from "next/server";
import { bigquery } from "@/lib/bigquery";
import { getRetentionQuery, getRetentionQueryUnlockCohort } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") || "30", 10);
  const cohort = (searchParams.get("cohort") || "signup") as "signup" | "unlock";

  try {
    const query = cohort === "unlock" ? getRetentionQueryUnlockCohort(days) : getRetentionQuery(days);
    const [rows] = await bigquery.query({ query });
    const r = (rows as { day_num: number; rate: number }[]) || [];
    const chart = r.map((x) => ({
      day: `D${x.day_num}`,
      rate: Number(x.rate ?? 0),
      wow: 0,
    }));
    return NextResponse.json({ chart, cohort });
  } catch (error) {
    console.error("BigQuery retention error:", error);
    return NextResponse.json({ chart: [], cohort }, { status: 500 });
  }
}
