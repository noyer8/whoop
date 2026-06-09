import { WHOOP_API_BASE } from "./config";

type Collection<T> = { records: T[]; next_token?: string | null };

/**
 * Récupère toutes les pages d'une collection Whoop depuis `start`.
 * Les collections paginées exposent `records` + `next_token`.
 */
export async function fetchAllRecords<T>(
  path: string,
  accessToken: string,
  start: Date,
  limit = 25
): Promise<T[]> {
  const out: T[] = [];
  let nextToken: string | undefined;

  do {
    const params = new URLSearchParams({
      start: start.toISOString(),
      limit: String(limit),
    });
    if (nextToken) params.set("nextToken", nextToken);

    const res = await fetch(`${WHOOP_API_BASE}${path}?${params.toString()}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`Whoop ${path} ${res.status}: ${await res.text()}`);
    }
    const page = (await res.json()) as Collection<T>;
    out.push(...(page.records ?? []));
    nextToken = page.next_token ?? undefined;
  } while (nextToken);

  return out;
}
