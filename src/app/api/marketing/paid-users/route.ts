import { NextResponse } from "next/server";
import { bigquery } from "@/lib/bigquery";
import {
  getPaidUsersKPIQuery,
  getPaidUsersD7RetentionQuery,
  getPaidUsersFirstPayDistQuery,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

const EMPTY = {
  total_payers: 0,
  total_revenue: 0,
  subscription_revenue: 0,
  arppu: 0,
  avg_purchases: 0,
  first_time_payers: 0,
  repeat_payers: 0,
  d7_retention: { total_first_payers: 0, d7_retained: 0, rate: 0 },
  first_pay_distribution: [] as { bucket: string; user_count: number; pct: number }[],
};

async function safeQuery(query: string) {
  try {
    const [rows] = await bigquery.query({ query });
    return rows;
  } catch (err) {
    console.error("Paid users sub-query error:", err);
    return [];
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = Math.min(parseInt(searchParams.get("days") || "30", 10), 90);

  try {
    const [kpiRows, retRows, distRows] = await Promise.all([
      safeQuery(getPaidUsersKPIQuery(days)),
      safeQuery(getPaidUsersD7RetentionQuery(days)),
      safeQuery(getPaidUsersFirstPayDistQuery(days)),
    ]);

    const kpi = (kpiRows as Record<string, number>[])[0] || {};
    const payers = Number(kpi.total_payers ?? 0);
    const purchases = Number(kpi.total_purchases ?? 0);
    const revenue = Number(kpi.total_revenue ?? 0);
    const subRevenue = Number(kpi.subscription_revenue ?? 0);
    const firstTimePayers = Number(kpi.first_time_payers ?? 0);
    const repeatPayers = Number(kpi.repeat_payers ?? 0);
    const arppu = payers > 0 ? Math.round((revenue / payers) * 100) / 100 : 0;
    const avgPurchases = payers > 0 ? Math.round((purchases / payers) * 10) / 10 : 0;

    const ret = (retRows as { total_first_payers: number; d7_retained: number }[])[0] || {
      total_first_payers: 0,
      d7_retained: 0,
    };
    const retFirstPayers = Number(ret.total_first_payers ?? 0);
    const retained = Number(ret.d7_retained ?? 0);
    const d7Rate = retFirstPayers > 0 ? Math.round((retained / retFirstPayers) * 1000) / 10 : 0;

    const bucketOrder = ["D0", "D1", "D2", "D3-6", "D7-13", "D14+"];
    const raw = (distRows as { bucket: string; user_count: number }[]) || [];
    const totalDistUsers = raw.reduce((s, b) => s + Number(b.user_count ?? 0), 0);
    const firstPayDist = bucketOrder.map((b) => {
      const found = raw.find((d) => d.bucket === b);
      const count = Number(found?.user_count ?? 0);
      return {
        bucket: b,
        user_count: count,
        pct: totalDistUsers > 0 ? Math.round((count / totalDistUsers) * 1000) / 10 : 0,
      };
    });

    return NextResponse.json({
      total_payers: payers,
      total_revenue: Math.round(revenue * 100) / 100,
      subscription_revenue: Math.round(subRevenue * 100) / 100,
      arppu,
      avg_purchases: avgPurchases,
      first_time_payers: firstTimePayers,
      repeat_payers: repeatPayers,
      d7_retention: { total_first_payers: retFirstPayers, d7_retained: retained, rate: d7Rate },
      first_pay_distribution: firstPayDist,
    });
  } catch (error) {
    console.error("Paid users error:", error);
    return NextResponse.json(EMPTY);
  }
}
