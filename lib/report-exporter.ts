import { FifoResult } from "./fifo";

export interface ExportSale {
  asset: string;
  sellDate: string; // ISO
  soldQuantity: number;
  grossProceeds: number;
  netProceeds: number;
  grossCost: number;
  netCost: number;
  profit: number;
  warning?: string | null;
  unmatchedQuantity?: number;
}

export interface YearExport {
  year: number;
  numberOfSales: number;
  totalGrossProceeds: number;
  totalNetProceeds: number;
  totalGrossCost: number;
  totalNetCost: number;
  realizedProfit: number;
  realizedLoss: number;
  netRealized: number;
  sales: ExportSale[];
}

export interface ExportResponse {
  years: YearExport[];
}

export function buildExportFromFifo(fifo: FifoResult, year?: number): ExportResponse {
  // Group sales by year (based on sale.date)
  const salesByYear = new Map<number, typeof fifo.sales>();

  for (const s of fifo.sales) {
    const y = s.date.getFullYear();
    if (year && y !== year) continue;
    if (!salesByYear.has(y)) salesByYear.set(y, [] as any);
    salesByYear.get(y)!.push(s as any);
  }

  const years: YearExport[] = [];

  const sortedYears = Array.from(salesByYear.keys()).sort((a, b) => b - a);

  for (const y of sortedYears) {
    const sales = salesByYear.get(y) || [];
    const exportSales: ExportSale[] = sales.map((s) => ({
      asset: s.asset,
      sellDate: s.date.toISOString(),
      soldQuantity: s.amountSold,
      grossProceeds: Number((s.grossProceeds ?? 0).toFixed(8)),
      netProceeds: Number(((s.netProceeds ?? s.grossProceeds ?? 0)).toFixed(8)),
      grossCost: Number(((s.grossCost ?? 0)).toFixed(8)),
      netCost: Number(((s.netCost ?? s.cost ?? 0)).toFixed(8)),
      profit: Number((s.profit ?? 0).toFixed(8)),
      warning: s.warning ?? null,
      unmatchedQuantity: s.unmatchedQuantity ?? 0,
    }));

    const totalGrossProceeds = Number(exportSales.reduce((sum, e) => sum + e.grossProceeds, 0).toFixed(8));
    const totalNetProceeds = Number(exportSales.reduce((sum, e) => sum + e.netProceeds, 0).toFixed(8));
    const totalGrossCost = Number(exportSales.reduce((sum, e) => sum + e.grossCost, 0).toFixed(8));
    const totalNetCost = Number(exportSales.reduce((sum, e) => sum + e.netCost, 0).toFixed(8));
    const realizedProfit = Number(exportSales.filter(e => e.profit > 0).reduce((sum, e) => sum + e.profit, 0).toFixed(8));
    const realizedLoss = Number(exportSales.filter(e => e.profit < 0).reduce((sum, e) => sum + e.profit, 0).toFixed(8));
    const netRealized = Number((realizedProfit + realizedLoss).toFixed(8));

    years.push({
      year: y,
      numberOfSales: sales.length,
      totalGrossProceeds,
      totalNetProceeds,
      totalGrossCost,
      totalNetCost,
      realizedProfit,
      realizedLoss,
      netRealized,
      sales: exportSales,
    });
  }

  return { years };
}
