// TODO: Legacy crypto parser. Securities broker parserji pridejo naslednji.
import Papa from "papaparse";
import type { Transaction } from "@/lib/types";

type BinanceRow = {
  Date: string;
  Pair: string;
  Side: string;
  Price: string;
  Executed: string;
  Amount: string;
  Fee: string;
};

function parsePair(pair: string) {
  const upper = pair.trim().toUpperCase();
  const knownQuotes = ["EUR", "USDT", "USDC", "BUSD", "BTC", "ETH"];

  for (const quote of knownQuotes) {
    if (upper.endsWith(quote)) {
      return {
        base: upper.slice(0, -quote.length),
        quote,
      };
    }
  }

  return {
    base: upper,
    quote: "",
  };
}

export async function parseBinanceCsv(csvText: string): Promise<Transaction[]> {
  const parsed = Papa.parse<BinanceRow>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });

  if (parsed.errors.length > 0) {
    throw new Error(parsed.errors[0]?.message || "Napaka pri branju Binance CSV.");
  }

  return parsed.data.map((row, i) => {
    const date = new Date(row.Date);
    const pair = row.Pair?.trim() || "";
    const side = row.Side?.trim().toUpperCase() || "";
    const price = Number(row.Price || 0);
    const executed = Number(row.Executed || 0);
    const amount = Number(row.Amount || 0) || executed;
    const fee = Number(row.Fee || 0);

    const { base, quote } = parsePair(pair);

    let type: Transaction["type"] = "buy";
    if (side === "BUY") type = quote === "EUR" ? "buy" : "swap";
    if (side === "SELL") type = quote === "EUR" ? "sell" : "swap";

    return {
      id: `binance-${i}-${date.getTime()}`,
      date,
      type,
      assetType: "crypto" as const,
      asset: base,
      amount,
      priceEur: quote === "EUR" ? price : 0,
      feeEur: quote === "EUR" ? fee : 0,
      exchange: "binance",
      note: JSON.stringify(row),
    };
  });
}