import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ANALYSIS_PROMPT = `你是 Fr. App 的增长负责人，拥有深厚的产品和商业化经验。请基于仪表盘数据产出一份高质量的结构化分析报告。

【产品机制 — 你必须深刻理解】
Fr. App 的核心飞轮是：
  Discovery (用户发现内容) → Unlock ($1解锁视频) → Scratch (自动触发刮卡获钻石) → Share (用户截图分享赢奖) → Referral (新用户被分享吸引下载) → Loop

经济模型：
- 1,150 钻石 = $1，可提现PayPal或用于再解锁
- 刮卡最高奖励 10,000 钻石 ≈ $8.70
- 收入来源：Unlock Pack（单次充值）和 Subscription（月/年订阅VIP）
- VIP可通过两种路径获得：真金白银付费 或 用积累的钻石/现金兑换
- 关键：只有当 Unlock→Scratch→Share 环节形成正循环，飞轮才能自转

【关键基准线】
- 注册转化: 29% → 目标 45%
- Unlock Loop转化: 88% → 维持 85%+
- 付费转化: 0.2% → 目标 1.5%
- D7留存: 2.1%(全体) / 6.8%(解锁用户) → 目标 5% / 15%
- ARPPU: $4.17 → 目标 $10+
- 月收入: $37.54 → M1 $200, M3 $1,000

【分析原则 — 极其重要】
1. 所有分析必须围绕飞轮展开。不是"这个国家有收入就做这个国家"，而是"这个国家的用户飞轮的哪个环节强/弱，能否低成本激活飞轮"
2. 渠道分析不只是看CPA，要看该渠道用户的Unlock率、Loop率、分享率，判断渠道质量
3. 商业化分析不只是看收入数字，要分析定价弹性、VIP转化路径效率、付费用户LTV
4. 留存分析要区分"解锁用户留存"和"未解锁用户留存"，因为解锁是飞轮核心动作
5. 每个结论必须给出可执行的下一步，且这个下一步必须是7天内可完成的具体动作
6. 对数据不确定的地方，直接标注"需后台验证"，不要编造
7. 不要说"建议优化注册流程"这种废话，要说"注册页第2步流失XX%，建议A/B测试将XX改为XX"

请输出 JSON 数组，每个对象代表一个分析板块。直接输出JSON，不要markdown代码块包裹。

[
  {
    "id": "flywheel_health",
    "title": "飞轮健康度诊断",
    "sections": [
      {
        "node": "Discovery/Registration/First Unlock/Unlock Loop/Scratch & Reward/Cashout/Share & Referral",
        "status": "healthy/warning/broken",
        "score": 0-10,
        "current_metric": "当前关键指标值",
        "benchmark": "基准/目标",
        "diagnosis": "具体诊断：这个节点为什么处于当前状态，数据依据是什么",
        "fix": "7天内可执行的具体修复方案（如果healthy则写如何维持）"
      }
    ],
    "overall_score": 0-10,
    "bottleneck": "当前飞轮最大瓶颈的深度分析（不是表面描述，要分析根因）",
    "flywheel_momentum": "飞轮是在加速、减速还是停滞？数据依据"
  },
  {
    "id": "monetization_depth",
    "title": "商业化深度分析",
    "sections": [
      {
        "topic": "分析主题",
        "finding": "发现（带数据）",
        "implication": "这意味着什么（商业含义）",
        "action": "应该怎么做"
      }
    ],
    "topics_to_cover": [
      "Unlock Pack vs Subscription 收入结构是否健康",
      "VIP兑换用户 vs 真付费用户 的行为差异和LTV差异",
      "ARPPU能否从$4.17提升到$10+的路径分析",
      "付费转化漏斗中最大的流失环节",
      "定价策略：当前$1/解锁 是否是最优定价",
      "IAP失败率分析和优化空间"
    ],
    "revenue_projection": "基于当前数据，从$37/月到$200/月的具体路径（不是空话，要量化每个杠杆能贡献多少增量）"
  },
  {
    "id": "channel_quality",
    "title": "渠道飞轮适配分析",
    "channels": [
      {
        "channel": "渠道名",
        "volume": "用户量",
        "unlock_conversion": "该渠道用户的解锁转化率（如有数据）",
        "pay_conversion": "付费转化率",
        "revenue": "贡献收入",
        "flywheel_fit": "该渠道用户与飞轮的适配度分析（不是简单说ROI高低，要分析这些用户是否会进入Unlock→Scratch→Share的循环）",
        "verdict": "加码/维持/暂停/调整",
        "reason": "具体原因"
      }
    ],
    "organic_vs_paid": "自然流量和付费流量的飞轮行为差异分析",
    "referral_health": "Frog/社交分享的裂变效率分析（这是飞轮的关键输出环节）"
  },
  {
    "id": "retention_unlock",
    "title": "留存与解锁行为分析",
    "findings": [
      {
        "insight": "发现",
        "data": "数据支撑",
        "so_what": "这意味着什么",
        "action": "怎么做"
      }
    ],
    "must_analyze": [
      "解锁用户 vs 未解锁用户的留存差异（这是产品PMF的核心验证）",
      "首次解锁到第二次解锁的转化率（Loop形成率）",
      "Power Users (10+次解锁) 的占比和行为特征",
      "D1→D7的留存衰减曲线是否合理",
      "什么时间点用户最容易流失"
    ]
  },
  {
    "id": "geo_flywheel",
    "title": "地理市场飞轮分析",
    "markets": [
      {
        "country": "国家",
        "users": "用户量",
        "flywheel_status": "该国家用户飞轮运转状态（不是只看收入，要看整个链路）",
        "strength": "该市场的优势环节",
        "weakness": "该市场的薄弱环节",
        "strategy": "针对性策略（不是泛泛的'加大投入'，是具体到应该在飞轮哪个环节发力）"
      }
    ],
    "priority_market": "应该优先投入的市场及原因（基于飞轮适配度，不是简单看用户量或收入）"
  },
  {
    "id": "weekly_actions",
    "title": "本周 Top 3 行动",
    "actions": [
      {
        "priority": 1,
        "action": "具体可执行的行动（必须是7天内能完成的）",
        "flywheel_node": "这个行动针对飞轮的哪个节点",
        "expected_impact": "预期量化影响（例：预计提升注册转化3-5pp，对应每周多XX个激活用户）",
        "effort": "执行难度和所需资源",
        "success_metric": "如何衡量这个行动是否成功"
      }
    ],
    "north_star_this_week": "本周最重要的一个数字是什么，为什么"
  }
]

【输出格式要求】
- 全部中文
- 所有结论必须有数字支撑
- 不使用emoji
- status字段只用 healthy/warning/broken
- 异动超过20%的指标要特别标注
- 合法JSON数组`;

function buildDataPayload(data: Record<string, unknown>): string {
  const parts: string[] = [];
  parts.push("=== DASHBOARD DATA SNAPSHOT ===\n");

  const kpi = data.kpi as Record<string, unknown> | undefined;
  if (kpi) {
    parts.push("## Core KPIs");
    parts.push(`DAU: ${kpi.dau} (7d ago: ${kpi.wow_dau})`);
    parts.push(`D1 Retention: ${kpi.d1_retention}% (7d ago: ${kpi.wow_d1}%)`);
    parts.push(`Pay Rate: ${kpi.pay_rate}% (7d ago: ${kpi.wow_pay_rate}%)`);
    parts.push(`ARPPU: $${kpi.arppu} (7d ago: $${kpi.wow_arppu})`);
    parts.push(`Revenue: $${kpi.revenue} (7d ago: $${kpi.wow_revenue})`);
    parts.push(`Withdrawal: $${kpi.withdrawal} (7d ago: $${kpi.wow_withdrawal})`);
    parts.push(`ROI: ${kpi.roi} (7d ago: ${kpi.wow_roi})`);
    parts.push(`Data range: ${kpi.data_range_start} ~ ${kpi.data_range_end}`);
  }

  const dt = data.dailyTrend as Record<string, unknown>[] | undefined;
  if (dt?.length) {
    parts.push("\n## Daily Trend");
    parts.push("Date | New | DAU | D1 | Unlock | Unlock>=2 | Payers | Revenue | Withdrawal");
    for (const r of dt) {
      parts.push(`${r.date} | ${r.new_users} | ${r.dau} | ${r.d1} | ${r.unlock_users} | ${r.unlock_ge2} | ${r.payers} | $${r.revenue} | $${r.withdrawal}`);
    }
  }

  const funnel = data.growthFunnel as Record<string, unknown>[] | undefined;
  if (funnel?.length) {
    parts.push("\n## Growth Funnel");
    for (const s of funnel) parts.push(`${s.stepLabel}: ${s.users} users (${s.conversion}% conversion)`);
  }

  const retention = data.retention as Record<string, unknown> | undefined;
  if (retention) {
    const chart = (retention.chart as Record<string, unknown>[]) || [];
    if (chart.length) {
      parts.push("\n## Retention");
      for (const r of chart) parts.push(`${r.day}: ${r.rate}% (WoW: ${Number(r.wow) >= 0 ? "+" : ""}${r.wow}pp)`);
    }
  }

  const geo = data.geoDistribution as Record<string, unknown>[] | undefined;
  if (geo?.length) {
    parts.push("\n## Geo Distribution");
    for (const g of geo.slice(0, 15)) parts.push(`${g.region_name || g.region}: ${g.users} users (${g.share}%)`);
  }

  const mon = data.monetization as Record<string, unknown>[] | undefined;
  if (mon?.length) {
    parts.push("\n## Monetization");
    for (const m of mon) parts.push(`${m.revenue_stream}: $${m.revenue} (${m.share}%)`);
  }

  const eh = data.economyHealth as Record<string, unknown> | undefined;
  if (eh) {
    const metrics = (eh.metrics as Record<string, unknown>[]) || [];
    if (metrics.length) {
      parts.push("\n## Economy Health");
      for (const m of metrics) parts.push(`${m.indicator}: ${m.value}`);
    }
  }

  const acq = data.userAcquisition as Record<string, unknown> | undefined;
  if (acq) {
    const channels = (acq.channelsSummary as Record<string, unknown>[]) || (acq.channels as Record<string, unknown>[]) || [];
    if (channels.length) {
      parts.push("\n## User Acquisition Channels");
      for (const c of channels) parts.push(`${c.channel}: ${c.new_users} users, ${c.payers} payers, $${c.revenue} rev, ${c.conversion}% conv`);
    }
  }

  const sub = data.subscriptionData as Record<string, unknown> | undefined;
  if (sub) {
    const kpiSub = sub.kpi as Record<string, unknown> | undefined;
    if (kpiSub) {
      parts.push("\n## Subscription/VIP");
      parts.push(`Exchange (free): ${kpiSub.total_exchange} users (auto: ${kpiSub.auto_convert}, manual: ${kpiSub.manual_convert})`);
      parts.push(`Paid (real $): ${kpiSub.total_paid} users, revenue: $${kpiSub.paid_revenue}`);
      parts.push(`IAP start: ${kpiSub.iap_start}, IAP fail: ${kpiSub.iap_fail}`);
    }
  }

  const paid = data.paidUsersData as Record<string, unknown> | undefined;
  if (paid) {
    parts.push("\n## Paid Users");
    parts.push(`Total payers: ${paid.total_payers}, Revenue: $${paid.total_revenue}`);
    parts.push(`First-time: ${paid.first_time_payers}, Repeat: ${paid.repeat_payers}`);
    parts.push(`ARPPU: $${paid.arppu}, Avg purchases: ${paid.avg_purchases}`);
    const d7 = paid.d7_retention as Record<string, unknown> | undefined;
    if (d7) parts.push(`Payer D7 retention: ${d7.rate}% (${d7.d7_retained}/${d7.total_first_payers})`);
  }

  const paidGeo = data.paidUsersGeo as Record<string, unknown>[] | undefined;
  if (paidGeo?.length) {
    parts.push("\n## Paid Users Geo");
    for (const g of paidGeo) parts.push(`${g.country_name || g.country}: ${g.payers} payers, $${g.revenue} (${g.revenue_share}%)`);
  }

  const unlock = data.unlockInsights as Record<string, unknown> | undefined;
  if (unlock) {
    parts.push("\n## Unlock Insights");
    const d7r = unlock.d7Retention as Record<string, unknown> | undefined;
    if (d7r) parts.push(`Unlock D7 retention: ${d7r.rate}% (${d7r.d7_retained}/${d7r.total_unlock_users})`);
    const dist = (unlock.distribution as Record<string, unknown>[]) || [];
    if (dist.length) {
      parts.push("Unlock count distribution (first 7 days):");
      for (const d of dist) parts.push(`  ${d.bucket}: ${d.user_count} users (${d.pct}%)`);
    }
  }

  const cf = data.contentFeed as Record<string, unknown> | undefined;
  if (cf) {
    for (const [key, label] of [["circle", "Circle"], ["featureCards", "Feature Cards"], ["exclusives", "Exclusives"]] as const) {
      const items = (cf[key] as Record<string, unknown>[]) || [];
      if (items.length) {
        parts.push(`\n## Content - ${label}`);
        for (const it of items) parts.push(`${it.area}: ${it.impressions} imp, ${it.ctr}% CTR`);
      }
    }
  }

  const cs = data.creatorSupply as Record<string, unknown> | undefined;
  if (cs) {
    const metrics = (cs.metrics as Record<string, number>) || {};
    if (Object.keys(metrics).length) {
      parts.push("\n## Creator Supply");
      for (const [k, v] of Object.entries(metrics)) parts.push(`${k}: ${v}`);
    }
  }

  return parts.join("\n");
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const dashboardData: Record<string, unknown> = body.dashboardData || {};
    const dataPayload = buildDataPayload(dashboardData);
    const userMessage = `以下是最新的仪表盘数据，请生成深度分析报告：\n\n${dataPayload}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: ANALYSIS_PROMPT }] },
          contents: [{ role: "user", parts: [{ text: userMessage }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 8192 },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("Gemini insights error:", err);
      return NextResponse.json({ error: "Gemini API error" }, { status: res.status });
    }

    const geminiData = await res.json();
    let text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    text = text.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();

    let sections;
    try {
      sections = JSON.parse(text);
    } catch {
      console.error("Failed to parse AI insights JSON, returning raw");
      return NextResponse.json({ raw: text, sections: null, generated_at: new Date().toISOString() });
    }

    return NextResponse.json({ sections, generated_at: new Date().toISOString() });
  } catch (error) {
    console.error("AI insights error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
