import { NextResponse } from "next/server";
import { getRetentionQuery, getRetentionQueryUnlockCohort } from "@/lib/queries";
import { runCachedBigQuery } from "@/lib/marketing-cache";

export const dynamic = "force-dynamic";

type Row = { day_num: number; rate: number };

function mapChart(rows: Row[]) {
  return (rows || []).map((x) => ({
    day: `D${x.day_num}`,
    rate: Number(x.rate ?? 0),
    wow: 0,
  }));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") || "30", 10);
  const cohort = (searchParams.get("cohort") || "signup") as "signup" | "unlock" | "both";

  try {
    if (cohort === "both") {
      const [signupRows, unlockRows] = await Promise.all([
        runCachedBigQuery<Row>(["marketing-retention", "signup", String(days)], getRetentionQuery(days)),
        runCachedBigQuery<Row>(["marketing-retention", "unlock", String(days)], getRetentionQueryUnlockCohort(days)),
      ]);
      return NextResponse.json({
        signup: { chart: mapChart(signupRows as Row[]), cohort: "signup" as const },
        unlock: { chart: mapChart(unlockRows as Row[]), cohort: "unlock" as const },
      });
    }

    const query = cohort === "unlock" ? getRetentionQueryUnlockCohort(days) : getRetentionQuery(days);
    const rows = await runCachedBigQuery<Row>(
      ["marketing-retention", cohort, String(days)],
      query
    );
    const chart = mapChart(rows as Row[]);
    return NextResponse.json({ chart, cohort });
  } catch (error) {
    console.error("BigQuery retention error:", error);
    return NextResponse.json({ chart: [], cohort: "signup" }, { status: 500 });
  }
}
