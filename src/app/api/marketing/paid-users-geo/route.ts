import { NextResponse } from "next/server";
import { bigquery } from "@/lib/bigquery";
import { getPaidUsersGeoQuery } from "@/lib/queries";

export const dynamic = "force-dynamic";

const COUNTRY_MAP: Record<string, { code: string; name: string }> = {
  "United States": { code: "US", name: "美国" },
  US: { code: "US", name: "美国" },
  "United Kingdom": { code: "GB", name: "英国" },
  GB: { code: "GB", name: "英国" },
  Canada: { code: "CA", name: "加拿大" },
  CA: { code: "CA", name: "加拿大" },
  Singapore: { code: "SG", name: "新加坡" },
  SG: { code: "SG", name: "新加坡" },
  Australia: { code: "AU", name: "澳大利亚" },
  AU: { code: "AU", name: "澳大利亚" },
  Germany: { code: "DE", name: "德国" },
  DE: { code: "DE", name: "德国" },
  France: { code: "FR", name: "法国" },
  FR: { code: "FR", name: "法国" },
  Indonesia: { code: "ID", name: "印度尼西亚" },
  Japan: { code: "JP", name: "日本" },
  India: { code: "IN", name: "印度" },
  Brazil: { code: "BR", name: "巴西" },
  Mexico: { code: "MX", name: "墨西哥" },
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = Math.min(parseInt(searchParams.get("days") || "30", 10), 90);

  try {
    const [rows] = await bigquery.query({ query: getPaidUsersGeoQuery(days) });
    const r = (rows as { country: string; payers: number; purchases: number; revenue: number }[]) || [];
    const totalPayers = r.reduce((s, x) => s + Number(x.payers), 0);
    const totalRevenue = r.reduce((s, x) => s + Number(x.revenue), 0);

    const data = r.map((x) => {
      const m = COUNTRY_MAP[x.country];
      const code = m?.code ?? (x.country?.length <= 3 ? x.country : x.country?.slice(0, 2).toUpperCase() ?? "??");
      const name = m?.name ?? x.country ?? "Other";
      const payers = Number(x.payers ?? 0);
      const rev = Number(x.revenue ?? 0);
      return {
        country: code,
        country_name: name,
        payers,
        payer_share: totalPayers > 0 ? Math.round((payers / totalPayers) * 1000) / 10 : 0,
        revenue: Math.round(rev * 100) / 100,
        revenue_share: totalRevenue > 0 ? Math.round((rev / totalRevenue) * 1000) / 10 : 0,
      };
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Paid users geo error:", error);
    return NextResponse.json([]);
  }
}
