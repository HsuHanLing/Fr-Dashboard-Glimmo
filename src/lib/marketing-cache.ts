import { unstable_cache } from "next/cache";
import { bigquery } from "@/lib/bigquery";

/** Short TTL for dashboard BigQuery reads (seconds). */
const REVALIDATE_SEC = 120;

/**
 * Cache identical BigQuery reads across requests (Route Handlers only).
 * Include all variable dimensions in keyParts (e.g. route name, days, cohort).
 */
export async function runCachedBigQuery<T = Record<string, unknown>>(
  keyParts: string[],
  query: string
): Promise<T[]> {
  return unstable_cache(
    async () => {
      const [rows] = await bigquery.query({ query });
      return (rows ?? []) as T[];
    },
    keyParts,
    { revalidate: REVALIDATE_SEC }
  )();
}
