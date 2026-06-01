import type { BrokerType, Transaction } from "@/lib/types";
import { parseEtoroCsv } from "./etoro";
import { parseBinanceCsv } from "./binance";
import { parseCoinbaseCsv } from "./coinbase";
import { parseKrakenCsv } from "./kraken";

export async function parseCsvByBroker(
  broker: BrokerType,
  csvText: string
): Promise<Transaction[]> {
  switch (broker) {
    case "etoro":
      return parseEtoroCsv(csvText);

    case "binance":
      return parseBinanceCsv(csvText);

    case "coinbase":
      return parseCoinbaseCsv(csvText);

    case "kraken":
      return parseKrakenCsv(csvText);

    case "trading212":
    case "interactive-brokers":
    case "revolut":
    case "trade-republic":
    case "saxo":
    case "other":
      return [];

    default:
      return [];
  }
}
