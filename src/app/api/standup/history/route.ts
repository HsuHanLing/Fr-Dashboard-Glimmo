import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "30", 10);

  const db = getSupabase();
  const { data, error } = await db
    .from("standup_records")
    .select("date, core_problems, strategy, action_items, upcoming_plans, updated_at")
    .order("date", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Standup history error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
