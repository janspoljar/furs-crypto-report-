import Papa from "papaparse";
import type { Transaction } from "@/lib/types";

type EToroRow = {
  Date: string;
  Type: string;
  Asset: string;
  Amount: string;
  Units: string;
  "Realized Equity Change": string;
  Fee: string;
};

function normalizeType(rawType: string): Transaction["type"] {
  const value = rawType.trim().toLowerCase();

  if (value.includes("buy")) return "buy";
  if (value.includes("sell")) return "sell";
  if (value.includes("dividend")) return "dividend";
  if (value.includes("transfer")) return "transfer";

  return "transfer";
}

function normalizeAssetType(rawType: string, asset: string): Transaction["assetType"] {
  const type = rawType.trim().toLowerCase();
  const assetUpper = asset.trim().toUpperCase();

  if (type.includes("dividend")) return "dividend";
  if (type.includes("cfd") || assetUpper.includes("CFD")) return "derivative";
  if (assetUpper.includes("ETF")) return "etf";

  return "stock";
}

export async function parseEtoroCsv(csvText: string): Promise<Transaction[]> {
  const parsed = Papa.parse<EToroRow>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });

  if (parsed.errors.length > 0) {
    throw new Error(parsed.errors[0]?.message || "Napaka pri branju eToro CSV.");
  }

  return parsed.data.map((row, i) => {
    const date = new Date(row.Date);
    const type = normalizeType(row.Type || "");
    const asset = (row.Asset || "").trim().toUpperCase();
    const units = Number(row.Units || 0);
    const amount = Number(row.Amount || 0);
    const realized = Number(row["Realized Equity Change"] || 0);
    const fee = Number(row.Fee || 0);

    let priceEur = 0;

    if (type === "buy" || type === "sell") {
      priceEur = units !== 0 ? Math.abs(amount / units) : 0;
    }

    if (type === "dividend") {
      priceEur = Math.abs(realized || amount);
    }

    return {
      id: `etoro-${i}-${date.getTime()}`,
      date,
      type,
      assetType: normalizeAssetType(row.Type || "", asset),
      asset,
      amount: type === "dividend" ? 1 : Math.abs(units),
      priceEur,
      feeEur: Math.abs(fee),
      broker: "etoro",
      note: JSON.stringify(row),
    };
  });
}