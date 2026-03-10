import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || new Date().toISOString().slice(0, 10);

  const db = getSupabase();
  const { data, error } = await db
    .from("standup_records")
    .select("*")
    .eq("date", date)
    .maybeSingle();

  if (error) {
    console.error("Standup GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (data) {
    return NextResponse.json(data);
  }

  const { data: prevRaw, error: prevErr } = await db
    .from("standup_records")
    .select("*")
    .lt("date", date)
    .order("date", { ascending: false })
    .limit(1);

  if (prevErr) {
    console.error("Standup carry-over error:", prevErr);
  }

  const prev = Array.isArray(prevRaw) ? prevRaw[0] ?? null : prevRaw;
  const template = {
    date,
    core_problems: prev?.core_problems ?? "",
    strategy: prev?.strategy ?? "",
    action_items: prev?.action_items ?? [],
    upcoming_plans: prev?.upcoming_plans ?? [],
    is_template: true,
  };

  return NextResponse.json(template);
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { date, core_problems, strategy, action_items, upcoming_plans } = body;

  if (!date) {
    return NextResponse.json({ error: "date is required" }, { status: 400 });
  }

  const db = getSupabase();
  const { data, error } = await db
    .from("standup_records")
    .upsert(
      {
        date,
        core_problems: core_problems ?? "",
        strategy: strategy ?? "",
        action_items: action_items ?? [],
        upcoming_plans: upcoming_plans ?? [],
        updated_at: new Date().toISOString(),
      },
      { onConflict: "date" }
    )
    .select()
    .single();

  if (error) {
    console.error("Standup PUT error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
