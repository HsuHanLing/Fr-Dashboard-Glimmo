import { NextResponse } from "next/server";
import { bigquery } from "@/lib/bigquery";
import { getUserAcquisitionQuery, getReferralTrackingQuery } from "@/lib/queries";

export const dynamic = "force-dynamic";

async function safeQuery(query: string) {
  try {
    const [rows] = await bigquery.query({ query });
    return rows;
  } catch (err) {
    console.error("User acquisition sub-query error:", err);
    return [];
  }
}

const COUNTRY_CODES: Record<string, string> = {
  HU: "Hungary", PT: "Portugal", BR: "Brazil", US: "USA", GB: "UK",
  DE: "Germany", FR: "France", ES: "Spain", IT: "Italy", IN: "India",
  ID: "Indonesia", PH: "Philippines", MX: "Mexico", AR: "Argentina",
  CO: "Colombia", CL: "Chile", PE: "Peru", VN: "Vietnam", TH: "Thailand",
  MY: "Malaysia", SG: "Singapore", JP: "Japan", KR: "Korea", TW: "Taiwan",
  RU: "Russia", TR: "Turkey", NG: "Nigeria", EG: "Egypt", ZA: "South Africa",
  PL: "Poland", NL: "Netherlands", SE: "Sweden", NO: "Norway", FI: "Finland",
  DK: "Denmark", AU: "Australia", NZ: "New Zealand", CA: "Canada",
  An: "Android", Hu: "Hungary",
};

type ChannelInfo = { channel: string; desc: string };

function isDynamicLink(s: string): boolean {
  return s === "getit" || s === "frog" || s.includes("frogcool") || s.includes("thefr.app");
}

function classifyChannel(source: string, medium: string, campaign: string): ChannelInfo {
  const s = (source || "").toLowerCase();
  const m = (medium || "").toLowerCase();
  const c = (campaign || "").toLowerCase();

  // --- 1. Paid Ads ---
  if (m === "cpc" || m === "cpm" || m === "cpv" || m === "paid") {
    if (s === "google") return { channel: "Google Ads", desc: "Google UAC / paid install campaigns" };
    if (s.includes("facebook") || s.includes("meta")) return { channel: "Meta Ads", desc: "Facebook/Instagram paid campaigns" };
    if (s.includes("tiktok")) return { channel: "TikTok Ads", desc: "TikTok paid campaigns" };
    if (s.includes("apple")) return { channel: "Apple Search Ads", desc: "Apple App Store search ads" };
    if (s.includes("snap")) return { channel: "Snapchat Ads", desc: "Snapchat paid campaigns" };
    return { channel: `${source} (Paid)`, desc: "Paid advertising channel" };
  }
  if (s === "apple" && m === "search") return { channel: "Apple Search Ads", desc: "Apple App Store search ads" };

  // --- 2. Dynamic Links (User Share / Distribution) ---
  // getit.thefr.app and open.frogcool.com are Firebase Dynamic Link domains.
  // All traffic from these sources = a user shared a link or the team distributed a link externally.
  if (isDynamicLink(s)) {
    if (c.includes("invite") || c.includes("referral")) {
      return { channel: "Dynamic Link (Invite)", desc: `In-app invite link shared by users via ${s === "getit" ? "getit.thefr.app" : "open.frogcool.com"}` };
    }
    if (c.includes("share") || c.includes("card")) {
      return { channel: "Dynamic Link (Content Share)", desc: `User shared content (video/scratch card) via ${s === "getit" ? "getit.thefr.app" : "open.frogcool.com"}` };
    }
    return {
      channel: "Dynamic Link (Share/Distribution)",
      desc: `Firebase Dynamic Link via ${s === "getit" ? "getit.thefr.app" : "open.frogcool.com"} — user-shared or externally distributed links`,
    };
  }

  // --- 3. App Store Organic ---
  if (s === "google-play" && m === "organic") return { channel: "Google Play (Organic)", desc: "Users who found the app by browsing/searching Google Play Store" };
  if (s === "google" && m === "organic") return { channel: "Google Search (Organic)", desc: "Users who found the app via Google web search results" };

  // --- 4. Direct / Unattributed ---
  if (s === "(direct)" || (s === "" && m === "(none)")) return { channel: "Direct / Unattributed", desc: "User opened app directly — no referral, campaign, or share link tracked" };

  // --- 5. In-App Referral ---
  if (s === "appreferral" || s === "app_referral") return { channel: "In-App Referral", desc: "Firebase in-app invite link (e.g. InviteFriendViaText, Click_ShareInviteLink)" };

  // --- 6. Social / Referral / Email ---
  if (m === "referral") return { channel: `${source} (Referral)`, desc: `Website referral traffic from ${source}` };
  if (m === "social" || s.includes("facebook") || s.includes("instagram") || s.includes("twitter") || s.includes("snap")) {
    return { channel: `${source} (Social)`, desc: `Social media traffic from ${source}` };
  }
  if (m === "email") return { channel: `${source} (Email)`, desc: `Email campaign from ${source}` };

  // --- 7. Other ---
  if (s && s !== "(not set)") return { channel: source, desc: `Traffic from ${source}` };
  return { channel: "Other", desc: "Unclassified traffic source" };
}

function parseCampaignLabel(campaign: string, channel: string): string {
  if (!campaign || campaign === "(not set)" || campaign === "(direct)") return "—";

  if (channel === "Google Ads") {
    // Parse patterns like "Install--Android-HU-匈牙利语-0.65" or "Hu-frog-20250830-Install-0.94-..."
    const parts = campaign.split("-").filter(Boolean);
    const regions: string[] = [];
    let platform = "";
    let type = "";
    const bidParts: string[] = [];

    for (const p of parts) {
      const upper = p.toUpperCase();
      if (COUNTRY_CODES[p] || COUNTRY_CODES[upper]) {
        regions.push(COUNTRY_CODES[p] || COUNTRY_CODES[upper]);
      } else if (upper === "ANDROID" || upper === "AN") {
        platform = "Android";
      } else if (upper === "IOS") {
        platform = "iOS";
      } else if (upper === "INSTALL") {
        type = "Install";
      } else if (/^\d+\.\d+$/.test(p)) {
        bidParts.push(`$${p}`);
      }
    }

    const label: string[] = [];
    if (type) label.push(type);
    if (platform) label.push(platform);
    if (regions.length) label.push(regions.join("+"));
    if (bidParts.length) label.push(`CPC: ${bidParts[bidParts.length - 1]}`);
    return label.length ? label.join(" · ") : campaign;
  }

  if (channel === "In-App Referral") return "In-App Invite Link";
  if (channel.startsWith("Dynamic Link")) return campaign === "(not set)" ? "—" : campaign;
  return campaign;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = Math.min(parseInt(searchParams.get("days") || "30", 10), 90);

  try {
    const [acqRows, refRows] = await Promise.all([
      safeQuery(getUserAcquisitionQuery(days)),
      safeQuery(getReferralTrackingQuery(days)),
    ]);

    const channelsRaw = (acqRows as { source: string; medium: string; campaign?: string; new_users: number; payers: number; revenue: number }[]).map((r) => {
      const rawCampaign = r.campaign ?? "(not set)";
      const { channel, desc } = classifyChannel(r.source ?? "(direct)", r.medium ?? "(none)", rawCampaign);
      return {
        source: r.source ?? "(direct)",
        medium: r.medium ?? "(none)",
        channel,
        channel_desc: desc,
        campaign: rawCampaign,
        campaign_label: parseCampaignLabel(rawCampaign, channel),
        new_users: Number(r.new_users ?? 0),
        payers: Number(r.payers ?? 0),
        revenue: Math.round(Number(r.revenue ?? 0) * 100) / 100,
        conversion: Number(r.new_users) > 0
          ? Math.round((Number(r.payers) / Number(r.new_users)) * 1000) / 10
          : 0,
      };
    });

    const channelAgg = new Map<string, { channel: string; channel_desc: string; new_users: number; payers: number; revenue: number }>();
    for (const row of channelsRaw) {
      const existing = channelAgg.get(row.channel);
      if (existing) {
        existing.new_users += row.new_users;
        existing.payers += row.payers;
        existing.revenue += row.revenue;
      } else {
        channelAgg.set(row.channel, {
          channel: row.channel,
          channel_desc: row.channel_desc,
          new_users: row.new_users,
          payers: row.payers,
          revenue: row.revenue,
        });
      }
    }
    const channelsSummary = [...channelAgg.values()]
      .map((c) => ({
        ...c,
        revenue: Math.round(c.revenue * 100) / 100,
        conversion: c.new_users > 0 ? Math.round((c.payers / c.new_users) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.new_users - a.new_users);

    const referrals = (refRows as { source: string; campaign: string; medium: string; events: number; users: number }[]).map((r) => {
      const rawCampaign = r.campaign ?? "(not set)";
      const { channel, desc } = classifyChannel(r.source ?? "(direct)", r.medium ?? "(none)", rawCampaign);
      return {
        source: r.source ?? "(direct)",
        campaign: rawCampaign,
        campaign_label: parseCampaignLabel(rawCampaign, channel),
        medium: r.medium ?? "(none)",
        channel,
        channel_desc: desc,
        events: Number(r.events ?? 0),
        users: Number(r.users ?? 0),
      };
    });

    return NextResponse.json({ channels: channelsRaw, channelsSummary, referrals });
  } catch (error) {
    console.error("User acquisition error:", error);
    return NextResponse.json({ channels: [], channelsSummary: [], referrals: [] });
  }
}
