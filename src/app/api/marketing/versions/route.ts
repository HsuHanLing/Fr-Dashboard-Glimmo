import { NextResponse } from "next/server";
import { bigquery } from "@/lib/bigquery";
import { getVersionsQuery } from "@/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [rows] = await bigquery.query({ query: getVersionsQuery(60) });
    const arr = (rows as Record<string, unknown>[]) || [];
    const versions = arr.map((r) => String(r.version ?? "")).filter(Boolean);
    return NextResponse.json(versions);
  } catch (error) {
    console.error("Versions error:", error);
    return NextResponse.json([], { status: 200 });
  }
}
