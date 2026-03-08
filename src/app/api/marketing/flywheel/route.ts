import { NextResponse } from "next/server";
import { bigquery } from "@/lib/bigquery";
import { getFlywheelQuery } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = Math.min(parseInt(searchParams.get("days") || "30", 10), 90);

  try {
    const [rows] = await bigquery.query({ query: getFlywheelQuery(days) });
    const r = (rows as Record<string, unknown>[])[0] || {};

    const n = (v: unknown) => Number(v ?? 0);
    const pct = (a: number, b: number) => b > 0 ? Math.round((a / b) * 1000) / 10 : 0;

    const firstOpen = n(r.first_open_users);
    const registered = n(r.registered_users);
    const firstUnlock = n(r.first_unlock_users);
    const totalUnlockers = n(r.total_unlockers);
    const loopUsers = n(r.loop_users);
    const powerUsers = n(r.power_users);
    const avgUnlocks = Math.round(Number(r.avg_unlocks ?? 0) * 10) / 10;
    const scratchUsers = n(r.scratch_users);
    const totalDiamonds = n(r.total_diamonds);
    const rewardUsers = n(r.reward_users);
    const scratchShareUsers = n(r.scratch_share_users);
    const shareSuccess = n(r.share_success);
    const shareCancel = n(r.share_cancel);
    const shareFail = n(r.share_fail);
    const cashoutUsers = n(r.cashout_users);
    const cashoutSuccess = n(r.cashout_success);
    const allShareUsers = n(r.all_share_users);
    const allShareClicks = n(r.all_share_clicks);
    const inviteClickUsers = n(r.invite_click_users);
    const textInviteUsers = n(r.text_invite_users);
    const snapchatUsers = n(r.snapchat_users);
    const shareLinkUsers = n(r.share_link_users);
    const inviteSuccessUsers = n(r.invite_success_users);
    const inviteSuccessEvents = n(r.invite_success_events);
    const landingShowUsers = n(r.landing_show_users);
    const landingClickUsers = n(r.landing_click_users);
    const deeplinkOpenUsers = n(r.deeplink_open_users);
    const totalActive = n(r.total_active);
    const payers = n(r.payers);
    const firstOpen7d = n(r.first_open_7d);
    const firstOpenPrev7d = n(r.first_open_prev7d);

    const regRate = pct(registered, firstOpen);
    const unlockRate = pct(firstUnlock, registered);
    const loopRate = pct(loopUsers, totalUnlockers);
    const scratchShareRate = pct(scratchShareUsers, scratchUsers);
    const avgReward = rewardUsers > 0 ? Math.round(totalDiamonds / rewardUsers) : 0;
    const payRate = pct(payers, totalActive);
    const discoveryWoW = firstOpenPrev7d > 0
      ? Math.round(((firstOpen7d - firstOpenPrev7d) / firstOpenPrev7d) * 100)
      : 0;

    const classify = (val: number, good: number, warn: number): "healthy" | "warning" | "broken" => {
      if (val >= good) return "healthy";
      if (val >= warn) return "warning";
      return "broken";
    };

    const nodes = [
      {
        id: "discovery",
        name: "Discovery",
        nameCn: "发现",
        metrics: {
          first_open: firstOpen,
          first_open_7d: firstOpen7d,
          wow_change: discoveryWoW,
          daily_avg: Math.round(firstOpen / Math.max(days, 1)),
        },
        status: classify(firstOpen7d, 50, 20),
        score: Math.min(10, Math.round((firstOpen7d / 50) * 10)),
        conversion: null as number | null,
        conversion_num: null as number | null,
        conversion_denom: null as number | null,
        benchmark: "50+/week new users",
      },
      {
        id: "registration",
        name: "Registration",
        nameCn: "注册",
        metrics: {
          registered,
          rate: regRate,
        },
        status: classify(regRate, 45, 25),
        score: Math.min(10, Math.round((regRate / 45) * 10)),
        conversion: regRate,
        conversion_num: registered,
        conversion_denom: firstOpen,
        benchmark: "45% target (baseline 29%)",
      },
      {
        id: "first_unlock",
        name: "First Unlock",
        nameCn: "首次解锁",
        metrics: {
          first_unlock: firstUnlock,
          rate: unlockRate,
        },
        status: classify(unlockRate, 40, 20),
        score: Math.min(10, Math.round((unlockRate / 50) * 10)),
        conversion: unlockRate,
        conversion_num: firstUnlock,
        conversion_denom: registered,
        benchmark: "40%+ of registered",
      },
      {
        id: "loop",
        name: "Unlock Loop",
        nameCn: "解锁循环",
        metrics: {
          total_unlockers: totalUnlockers,
          loop_users: loopUsers,
          power_users: powerUsers,
          avg_unlocks: avgUnlocks,
          loop_rate: loopRate,
        },
        status: classify(loopRate, 85, 60),
        score: Math.min(10, Math.round((loopRate / 85) * 10)),
        conversion: loopRate,
        conversion_num: loopUsers,
        conversion_denom: totalUnlockers,
        benchmark: "85%+ loop rate (baseline 88%)",
      },
      {
        id: "scratch",
        name: "Scratch & Reward",
        nameCn: "刮卡与奖励",
        metrics: {
          scratch_users: scratchUsers,
          reward_users: rewardUsers,
          total_diamonds: totalDiamonds,
          avg_reward: avgReward,
          scratch_rate: pct(scratchUsers, totalActive),
          scratch_rate_denom: totalActive,
        },
        status: classify(pct(scratchUsers, totalActive), 30, 15),
        score: Math.min(10, Math.round((pct(scratchUsers, totalActive) / 40) * 10)),
        conversion: pct(scratchUsers, totalActive),
        conversion_num: scratchUsers,
        conversion_denom: totalActive,
        benchmark: "30%+ of active users scratch",
      },
      {
        id: "share",
        name: "Share",
        nameCn: "分享",
        metrics: {
          scratch_users: scratchUsers,
          scratch_share_users: scratchShareUsers,
          share_success: shareSuccess,
          share_cancel: shareCancel,
          share_fail: shareFail,
          share_rate: scratchShareRate,
          share_success_rate: scratchShareUsers > 0 ? pct(shareSuccess, shareSuccess + shareCancel + shareFail) : 0,
          share_success_denom: shareSuccess + shareCancel + shareFail,
        },
        status: classify(scratchShareRate, 20, 8),
        score: Math.min(10, Math.round((scratchShareRate / 25) * 10)),
        conversion: scratchShareRate,
        conversion_num: scratchShareUsers,
        conversion_denom: scratchUsers,
        benchmark: "20%+ scratch-to-share",
      },
      {
        id: "cashout",
        name: "Cashout",
        nameCn: "提现",
        metrics: {
          scratch_users: scratchUsers,
          cashout_users: cashoutUsers,
          cashout_success: cashoutSuccess,
          cashout_rate: pct(cashoutUsers, scratchUsers),
        },
        status: classify(pct(cashoutUsers, scratchUsers), 15, 5),
        score: Math.min(10, Math.round((pct(cashoutUsers, scratchUsers) / 20) * 10)),
        conversion: pct(cashoutUsers, scratchUsers),
        conversion_num: cashoutUsers,
        conversion_denom: scratchUsers,
        benchmark: "15%+ scratch users cash out",
      },
      {
        id: "referral",
        name: "Referral",
        nameCn: "推荐",
        metrics: {
          all_share_users: allShareUsers,
          all_share_clicks: allShareClicks,
          invite_button: inviteClickUsers,
          text_invite: textInviteUsers,
          snapchat_invite: snapchatUsers,
          share_link: shareLinkUsers,
          invite_success_users: inviteSuccessUsers,
          invite_success_events: inviteSuccessEvents,
          landing_show_users: landingShowUsers,
          landing_click_users: landingClickUsers,
          deeplink_open_users: deeplinkOpenUsers,
          invite_success_rate: pct(inviteSuccessUsers, allShareUsers),
          referral_rate: pct(inviteSuccessUsers, totalActive),
          referral_rate_denom: totalActive,
        },
        status: classify(pct(inviteSuccessUsers, totalActive), 5, 2),
        score: Math.min(10, Math.round((pct(inviteSuccessUsers, totalActive) / 8) * 10)),
        conversion: pct(allShareUsers, totalActive),
        conversion_num: allShareUsers,
        conversion_denom: totalActive,
        benchmark: "5%+ active users refer",
      },
    ];

    const overallScore = Math.round(nodes.reduce((s, n) => s + n.score, 0) / nodes.length);

    const summary = {
      total_active: totalActive,
      payers,
      pay_rate: payRate,
      first_open: firstOpen,
    };

    return NextResponse.json({ nodes, overallScore, summary, days });
  } catch (error) {
    console.error("Flywheel query error:", error);
    return NextResponse.json({ nodes: [], overallScore: 0, summary: {}, days, error: String(error) });
  }
}
