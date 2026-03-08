import { NextResponse } from "next/server";
import { bigquery } from "@/lib/bigquery";
import { getContentFeedQuery } from "@/lib/queries";

export const dynamic = "force-dynamic";

type RawRow = {
  area: string;
  impressions: number;
  clicks: number;
  users: number;
  video_starts: number;
  video_completes: number;
  video_replays: number;
  ctr: number;
  completion_rate: number;
  replay_rate: number;
};

function mapRow(a: RawRow) {
  return {
    area: a.area || "Other",
    impressions: Number(a.impressions ?? 0),
    ctr: Math.round(Number(a.ctr ?? 0) * 10) / 10,
    completion: a.video_starts > 0 ? Math.round(Number(a.completion_rate ?? 0) * 10) / 10 : null,
    replay: a.video_completes > 0 ? Math.round(Number(a.replay_rate ?? 0) * 10) / 10 : null,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") || "30", 10);

  try {
    const [rows] = await bigquery.query({ query: getContentFeedQuery(days) });
    const r = (rows as RawRow[]) || [];

    const circle = r
      .filter((x) => ["好友", "ForYou", "Friend", "Search"].some((k) => x.area?.includes(k)))
      .slice(0, 5);
    const featureCards = r
      .filter((x) => ["Sequel", "VideoPlay", "SUP", "引导", "创意", "邀请", "Feature"].some((k) => x.area?.includes(k)))
      .slice(0, 5);
    const exclusives = r
      .filter((x) => ["KOL", "creator", "创作者", "Exclusive"].some((k) => x.area?.includes(k)))
      .slice(0, 3);

    return NextResponse.json({
      circle: circle.map(mapRow),
      featureCards: featureCards.map(mapRow),
      exclusives: exclusives.map(mapRow),
    });
  } catch (error) {
    console.error("BigQuery content-feed error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
