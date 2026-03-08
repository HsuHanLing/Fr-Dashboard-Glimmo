import { NextResponse } from "next/server";
import { bigquery } from "@/lib/bigquery";
import { getEconomyHealthQuery } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") || "30", 10);
  const segment = searchParams.get("segment") || "all";

  try {
    const [rows] = await bigquery.query({ query: getEconomyHealthQuery(days, segment) });
    const r = (rows as Record<string, number>[])[0] || {};

    const totalDau = Number(r.total_dau ?? 0);
    const unlockEvents = Number(r.unlock_events ?? 0);
    const unlockUsers = Number(r.unlock_users ?? 0);
    const scratchEvents = Number(r.scratch_events ?? 0);
    const scratchUsers = Number(r.scratch_users ?? 0);
    const rewardEvents = Number(r.reward_events ?? 0);
    const rewardDiamonds = Number(r.reward_diamonds_total ?? 0);
    const upgradeUsers = Number(r.upgrade_users ?? 0);

    const avgUnlocksPerUserDay =
      unlockUsers > 0 && days > 0
        ? Math.round((unlockEvents / unlockUsers / days) * 10) / 10
        : 0;
    const scratchRate =
      totalDau > 0 ? Math.round((scratchUsers / totalDau) * 1000) / 10 : 0;
    const upgradeRate =
      totalDau > 0 ? Math.round((upgradeUsers / totalDau) * 1000) / 10 : 0;
    const avgRewardPerScratch =
      rewardEvents > 0 ? Math.round(rewardDiamonds / rewardEvents) : 0;

    const chart = [
      { indicator: "解锁消耗", value: avgUnlocksPerUserDay, label: "Avg unlocks/user/day", unit: "" },
      { indicator: "刮刮卡", value: scratchRate, label: "Scratch card open rate", unit: "%" },
      { indicator: "升级卡", value: upgradeRate, label: "Upgrade card usage rate", unit: "%" },
    ];
    const metrics = [
      { indicator: "Avg unlocks / user / day", value: avgUnlocksPerUserDay.toFixed(1) },
      { indicator: "Scratch card open rate", value: `${scratchRate}%` },
      { indicator: "Upgrade card usage rate", value: `${upgradeRate}%` },
      { indicator: "Avg reward per scratch", value: rewardEvents > 0 ? `${avgRewardPerScratch.toLocaleString()} diamonds` : "N/A" },
    ];
    return NextResponse.json({ chart, metrics, segment, active_users: totalDau });
  } catch (error) {
    console.error("BigQuery economy-health error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
