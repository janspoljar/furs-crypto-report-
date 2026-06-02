import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/route-handler";

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current.trim());
  return fields;
}

function findColumn(normalizedKeys: string[], originalKeys: string[], row: Record<string, string>, candidates: string[]) {
  for (const c of candidates) {
    const i = normalizedKeys.indexOf(c);
    if (i !== -1) return row[originalKeys[i]];
  }
  return undefined;
}

function parseNumber(v: string | undefined) {
  if (!v) return 0;
  const n = Number(v.replace(/,/g, ".").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function normalizeType(v: string) {
  const l = v.toLowerCase();
  if (l.includes("buy")) return "buy";
  if (l.includes("sell")) return "sell";
  if (l.includes("deposit") || l.includes("withdrawal") || l.includes("transfer")) return "transfer";
  if (l.includes("dividend") || l.includes("interest") || l.includes("staking")) return "staking";
  return "fee";
}

interface PreviewRow {
  date: string;
  type: string;
  asset: string;
  amount: number;
  priceEur: number;
}

function parseRow(broker: string, row: Record<string, string>): PreviewRow | null {
  const originalKeys = Object.keys(row);
  const normalizedKeys = originalKeys.map(k => k.toLowerCase().trim());
  const find = (candidates: string[]) => findColumn(normalizedKeys, originalKeys, row, candidates);

  let date: string | undefined;
  let typeRaw: string | undefined;
  let asset: string | undefined;
  let amountStr: string | undefined;
  let priceStr: string | undefined;
  let totalStr: string | undefined;

  if (broker === "trading212") {
    date = find(["date", "time", "created at", "timestamp", "execution time"]);
    typeRaw = find(["action", "type", "side", "operation"]);
    asset = find(["ticker", "instrument", "symbol", "isin", "name"]);
    amountStr = find(["number of shares", "no. of shares", "quantity", "qty", "shares", "units"]);
    priceStr = find(["price per share", "price / share", "price", "rate", "share price"]);
    totalStr = find(["total", "amount", "value", "result", "total amount"]);
  } else {
    date = find(["date", "time", "created at", "timestamp"]);
    typeRaw = find(["type", "action", "side"]);
    asset = find(["asset", "ticker", "symbol", "instrument"]);
    amountStr = find(["amount", "quantity", "qty", "shares", "units"]);
    priceStr = find(["price", "total", "value", "amount eur", "price eur"]);
    totalStr = priceStr;
  }

  if (!date || !typeRaw) return null;
  if (broker === "trading212" && !asset) {
    const actionLower = (typeRaw ?? "").toLowerCase();
    const isNonAsset = actionLower.includes("deposit") || actionLower.includes("withdrawal") ||
      actionLower.includes("dividend") || actionLower.includes("interest") || actionLower.includes("staking");
    if (!isNonAsset) return null;
  } else if (broker !== "trading212" && !asset) {
    return null;
  }

  const amount = parseNumber(amountStr);
  let priceEur = 0;
  if (priceStr) priceEur = parseNumber(priceStr);
  else if (totalStr && amount > 0) priceEur = parseNumber(totalStr) / amount;
  else if (totalStr) priceEur = parseNumber(totalStr);

  return {
    date: date ?? "",
    type: normalizeType(typeRaw ?? ""),
    asset: (asset ?? "").toUpperCase(),
    amount,
    priceEur,
  };
}

function extractYear(dateStr: string): number | null {
  const m = dateStr.match(/\b(20\d{2})\b/);
  return m ? parseInt(m[1]) : null;
}

export async function POST(req: Request) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const broker = formData.get("broker");
    const file = formData.get("file");

    if (!broker || typeof broker !== "string") {
      return NextResponse.json({ error: "Missing broker." }, { status: 400 });
    }
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file." }, { status: 400 });
    }

    const content = await file.text();
    const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) {
      return NextResponse.json({ error: "Datoteka je prazna ali ne vsebuje podatkov." }, { status: 400 });
    }

    const headers = parseCSVLine(lines[0]);
    const rowLines = lines.slice(1);

    const parsed: PreviewRow[] = [];
    for (const line of rowLines) {
      const values = parseCSVLine(line);
      const rowObj: Record<string, string> = {};
      headers.forEach((h, i) => { rowObj[h] = values[i] ?? ""; });
      const row = parseRow(broker, rowObj);
      if (row) parsed.push(row);
    }

    const count = parsed.length;
    const uniqueAssets = Array.from(new Set(
      parsed.filter(r => r.type === "buy" || r.type === "sell").map(r => r.asset).filter(Boolean)
    ));

    const years = parsed.map(r => extractYear(r.date)).filter((y): y is number => y !== null);
    const minYear = years.length ? Math.min(...years) : null;
    const maxYear = years.length ? Math.max(...years) : null;

    const previewRows = parsed.slice(0, 5);

    return NextResponse.json({
      count,
      broker,
      tickers: uniqueAssets,
      yearRange: minYear ? { min: minYear, max: maxYear ?? minYear } : null,
      rows: previewRows,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Napaka pri predogledu." },
      { status: 500 }
    );
  }
}
