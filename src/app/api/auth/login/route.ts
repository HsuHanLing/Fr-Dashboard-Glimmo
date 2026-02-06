import { NextResponse } from "next/server";
import { createToken, isAuthEnabled, COOKIE_NAME } from "@/lib/auth";

export async function POST(request: Request) {
  if (!isAuthEnabled()) {
    return NextResponse.json({ error: "Auth not configured" }, { status: 500 });
  }
  const body = await request.json();
  const password = body?.password ?? "";
  const expected = process.env.DASHBOARD_PASSWORD ?? "";

  if (password !== expected || !expected) {
    return NextResponse.json({ error: "Invalid key" }, { status: 401 });
  }

  const token = await createToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });
  return res;
}
