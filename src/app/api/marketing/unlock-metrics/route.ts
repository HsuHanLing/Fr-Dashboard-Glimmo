import { NextResponse } from "next/server";
import { bigquery } from "@/lib/bigquery";
import { getUnlockD7RetentionQuery, getUnlockDistributionQuery } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = Math.min(parseInt(searchParams.get("days") || "30", 10), 90);

  try {
    const [retRows, distRows] = await Promise.all([
      bigquery.query({ query: getUnlockD7RetentionQuery(days) }).then(([r]) => r),
      bigquery.query({ query: getUnlockDistributionQuery(days) }).then(([r]) => r),
    ]);

    const ret = (retRows as { total_unlock_users: number; d7_retained: number }[])[0] || {
      total_unlock_users: 0,
      d7_retained: 0,
    };
    const total = Number(ret.total_unlock_users ?? 0);
    const retained = Number(ret.d7_retained ?? 0);
    const rate = total > 0 ? Math.round((retained / total) * 1000) / 10 : 0;

    const bucketOrder = ["0", "1", "2", "3", "4", "5-9", "10+"];
    const raw = (distRows as { bucket: string; user_count: number }[]) || [];
    const totalDistUsers = raw.reduce((s, b) => s + Number(b.user_count ?? 0), 0);
    const distribution = bucketOrder.map((b) => {
      const found = raw.find((d) => d.bucket === b);
      const count = Number(found?.user_count ?? 0);
      return {
        bucket: b,
        user_count: count,
        pct: totalDistUsers > 0 ? Math.round((count / totalDistUsers) * 1000) / 10 : 0,
      };
    });

    const now = new Date();
    const cohortEnd = new Date(now);
    cohortEnd.setDate(cohortEnd.getDate() - 7);
    const cohortStart = new Date(now);
    cohortStart.setDate(cohortStart.getDate() - days);

    return NextResponse.json({
      days,
      cohort_start: cohortStart.toISOString().slice(0, 10),
      cohort_end: cohortEnd.toISOString().slice(0, 10),
      d7_retention: { total_unlock_users: total, d7_retained: retained, rate },
      distribution,
      distribution_total_users: totalDistUsers,
    });
  } catch (error) {
    console.error("Unlock metrics error:", error);
    return NextResponse.json(
      {
        days,
        cohort_start: "",
        cohort_end: "",
        d7_retention: { total_unlock_users: 0, d7_retained: 0, rate: 0 },
        distribution: [],
        distribution_total_users: 0,
      },
      { status: 500 }
    );
  }
}
