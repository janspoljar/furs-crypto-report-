const rateCache = new Map<string, number>();

function toDateStr(date: Date | string): string {
  if (typeof date === "string") return date.slice(0, 10);
  return date.toISOString().slice(0, 10);
}

function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * Fetch ECB reference rate for a given currency against EUR.
 * Returns the number of foreign currency units per 1 EUR (e.g. USD/EUR = 1.08 means 1 EUR = 1.08 USD).
 * To convert an amount from foreign currency to EUR: amount / rate.
 * Falls back up to 7 days back to handle weekends and ECB holidays.
 */
export async function getEcbRate(date: Date | string, currency: string): Promise<number> {
  if (currency === "EUR") return 1;

  const dateStr = toDateStr(date);
  const cacheKey = `${currency}:${dateStr}`;
  if (rateCache.has(cacheKey)) return rateCache.get(cacheKey)!;

  for (let daysBack = 0; daysBack < 8; daysBack++) {
    const tryDate = shiftDate(dateStr, -daysBack);
    const url =
      `https://data-api.ecb.europa.eu/service/data/EXR/D.${currency}.EUR.SP00.A` +
      `?startPeriod=${tryDate}&endPeriod=${tryDate}&format=csvdata`;

    try {
      const res = await fetch(url, { next: { revalidate: 86400 } } as RequestInit);
      if (!res.ok) continue;

      const text = await res.text();
      const lines = text.trim().split("\n").filter(Boolean);
      if (lines.length < 2) continue;

      const headers = lines[0].split(",");
      const obsIdx = headers.indexOf("OBS_VALUE");
      if (obsIdx === -1) continue;

      const rate = parseFloat(lines[1].split(",")[obsIdx]);
      if (!isFinite(rate) || rate <= 0) continue;

      rateCache.set(cacheKey, rate);
      return rate;
    } catch {
      continue;
    }
  }

  throw new Error(`ECB rate unavailable for ${currency} on ${dateStr}`);
}
