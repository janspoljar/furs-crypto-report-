import type { BrokerType } from "@/lib/types";

export interface DetectionResult {
  broker: BrokerType | null;
  confidence: "high" | "low";
  label: string | null;
}

export function detectBrokerFromCsv(csvText: string): DetectionResult {
  const sample = csvText.slice(0, 2000);
  const lines = sample.split("\n").slice(0, 8);
  const header = lines[0] ?? "";
  const allText = lines.join(" ").toLowerCase();

  // Trading212 — very distinctive header
  if (
    header.includes("Price / share") ||
    (header.includes("Action") && header.includes("ISIN") && header.includes("Ticker"))
  ) {
    return { broker: "trading212", confidence: "high", label: "Trading212" };
  }

  // eToro — Account Statement CSV has these columns
  if (
    allText.includes("position id") ||
    (allText.includes("open date") && allText.includes("close date") && allText.includes("units"))
  ) {
    return { broker: "etoro", confidence: "high", label: "eToro" };
  }

  // Revolut — Started Date + Completed Date
  if (allText.includes("started date") && allText.includes("completed date")) {
    return { broker: "revolut", confidence: "high", label: "Revolut" };
  }

  // Interactive Brokers — branding or specific columns
  if (
    allText.includes("interactive brokers") ||
    (allText.includes("asset category") && allText.includes("t. price"))
  ) {
    return { broker: "interactive-brokers", confidence: "high", label: "Interactive Brokers" };
  }

  // Trade Republic — branding or specific CSV pattern
  if (
    allText.includes("trade republic") ||
    (header.includes("ISIN") && header.includes("Status") && header.includes("Shares"))
  ) {
    return { broker: "trade-republic", confidence: "high", label: "Trade Republic" };
  }

  // N26 — bank CSV with Payee + Account number + Payment reference
  if (allText.includes("payee") && allText.includes("account number") && allText.includes("payment reference")) {
    return { broker: "n26", confidence: "high", label: "N26" };
  }

  // Saxo — branding or specific columns
  if (
    allText.includes("saxo") ||
    (allText.includes("instrument") && allText.includes("trade id") && allText.includes("order id"))
  ) {
    return { broker: "saxo", confidence: "high", label: "Saxo Bank" };
  }

  return { broker: null, confidence: "low", label: null };
}
