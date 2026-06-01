// ============================================================
// FIFO helper za osnovni realiziran dobiček / izgubo iz buy/sell transakcij.
// Podpora v tej fazi: samo "buy" in "sell" v EUR.
// Preostale tipe (transfer, deposit, withdrawal, dividend, interest, fee) ignoriramo.
// Predpostavka: priceEur je enotska cena v EUR.
// Fees niso vključene v cost basis / proceeds v tej enostavni verziji.
// ============================================================

export type TransactionType =
  | "buy"
  | "sell"
  | "transfer"
  | "swap"
  | "staking"
  | "fee"
  | "dividend"
  | "interest"
  | "deposit"
  | "withdrawal";

export interface Transaction {
  id: string;
  date: Date;
  type: TransactionType;
  asset: string;
  amount: number;
  priceEur: number;
  feeEur?: number;
  exchange?: string;
  note?: string;
}

export interface FifoLot {
  date: Date;
  amount: number;
  costPerUnit: number;
  feePerUnit: number;
  originalAmount: number;
  exchange?: string;
}

export interface TaxableSale {
  date: Date;
  asset: string;
  amountSold: number;
  matchedQuantity: number;
  unmatchedQuantity: number;
  salePricePerUnit: number;
  grossProceeds: number;
  netProceeds: number;
  grossCost: number;
  netCost: number;
  feeEur: number;
  acquisitions: {
    date: Date;
    amount: number;
    costPerUnit: number;
    feePerUnit: number;
  }[];
  cost: number;
  profit: number;
  taxAmount: number;
  warning?: string;
}

export interface FifoResult {
  sales: TaxableSale[];
  totalProfit: number;
  totalLoss: number;
  totalTax: number;
  remainingLots: Map<string, FifoLot[]>;
  summary: { asset: string; profit: number; loss: number; tax: number }[];
}

const TAX_RATE = 0.25;

function round8(n: number): number {
  return parseFloat(n.toFixed(8));
}

export function runFifo(transactions: Transaction[]): FifoResult {
  const sorted = [...transactions].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );

  const lots = new Map<string, FifoLot[]>();
  const sales: TaxableSale[] = [];

  for (const tx of sorted) {
    if (tx.type === "transfer" || tx.type === "swap" || tx.type === "fee") continue;

    const asset = tx.asset.toUpperCase();

      if (tx.type === "buy") {
      if (!lots.has(asset)) lots.set(asset, []);
      const buyFee = tx.feeEur ?? 0;
      const amount = round8(tx.amount);
      const costPerUnit = round8(tx.priceEur);
      const feePerUnit = amount > 0 ? round8(buyFee / amount) : 0;

      lots.get(asset)!.push({
        date: tx.date,
        amount,
        costPerUnit,
        feePerUnit,
        originalAmount: amount,
        exchange: tx.exchange,
      });
    }

    if (tx.type === "sell") {
      const queue = lots.get(asset);
      let remainingToSell = round8(tx.amount);
      const acquisitionsUsed: TaxableSale["acquisitions"] = [];
      let grossCost = 0;
      let netCost = 0;
      let warning: string | undefined;

      if (!queue || queue.length === 0) {
        warning = `Noben buy lot ni na voljo za sell ${asset}.`;
      }

      while (remainingToSell > 0 && queue && queue.length > 0) {
        const lot = queue[0];
        if (!lot) break;

        const usedFromLot = round8(Math.min(lot.amount, remainingToSell));
        const costGross = round8(usedFromLot * lot.costPerUnit);
        const feeCost = round8(usedFromLot * lot.feePerUnit);
        const netCostPiece = round8(costGross + feeCost);

        grossCost = round8(grossCost + costGross);
        netCost = round8(netCost + netCostPiece);

        acquisitionsUsed.push({
          date: lot.date,
          amount: usedFromLot,
          costPerUnit: lot.costPerUnit,
          feePerUnit: lot.feePerUnit,
        });

        lot.amount = round8(lot.amount - usedFromLot);
        remainingToSell = round8(remainingToSell - usedFromLot);
        if (lot.amount === 0) queue.shift();
      }

      const amountSold = round8(tx.amount);
      const matchedQuantity = round8(amountSold - remainingToSell);
      const salePricePerUnit = round8(tx.priceEur);
      const grossProceeds = round8(amountSold * salePricePerUnit);
      const sellFee = tx.feeEur ?? 0;
      const netProceeds = round8(grossProceeds - sellFee);
      const profit = round8(netProceeds - netCost);
      const taxAmount = profit > 0 ? round8(profit * TAX_RATE) : 0;

      if (remainingToSell > 0) {
        warning = warning ?? `Prodanih ${amountSold} ${asset}, a samo ${matchedQuantity} je bilo mogoče ujemati z buy loti.`;
      }

      sales.push({
        date: tx.date,
        asset,
        amountSold,
        matchedQuantity,
        unmatchedQuantity: remainingToSell,
        salePricePerUnit,
        grossProceeds,
        netProceeds,
        grossCost,
        netCost,
        feeEur: sellFee,
        acquisitions: acquisitionsUsed,
        cost: netCost,
        profit,
        taxAmount,
        warning,
      });
    }
  }

  const totalProfit = round8(sales.filter(s => s.profit > 0).reduce((sum, s) => sum + s.profit, 0));
  const totalLoss   = round8(sales.filter(s => s.profit < 0).reduce((sum, s) => sum + s.profit, 0));
  const totalTax    = round8(sales.reduce((sum, s) => sum + s.taxAmount, 0));

  const assetMap = new Map<string, { profit: number; loss: number; tax: number }>();
  for (const s of sales) {
    if (!assetMap.has(s.asset)) assetMap.set(s.asset, { profit: 0, loss: 0, tax: 0 });
    const e = assetMap.get(s.asset)!;
    if (s.profit > 0) e.profit = round8(e.profit + s.profit);
    else e.loss = round8(e.loss + s.profit);
    e.tax = round8(e.tax + s.taxAmount);
  }

  const summary = Array.from(assetMap.entries()).map(([asset, data]) => ({ asset, ...data }));
  return { sales, totalProfit, totalLoss, totalTax, remainingLots: lots, summary };
}
