export type BrokerType =
  | "etoro"
  | "trading212"
  | "interactive-brokers"
  | "revolut"
  | "trade-republic"
  | "n26"
  | "saxo"
  | "other";

export type AssetType =
  | "stock"
  | "etf"
  | "derivative"
  | "dividend";

export type TransactionType =
  | "buy"
  | "sell"
  | "staking"
  | "transfer"
  | "fee";

export interface Transaction {
  id: string;
  date: Date;
  type: TransactionType;
  assetType: AssetType;
  asset: string;
  isin?: string;
  amount: number;
  priceEur: number;
  feeEur?: number;
  broker?: BrokerType;
  exchange?: string;
  note?: string;
}

export interface TaxpayerProfile {
  taxNumber: string;
  fullName: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
}
