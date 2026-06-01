import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { runFifo } from "@/lib/fifo";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userId = body.userId as string | undefined;
    const targetYear = Number(body.targetYear);

    if (!userId) {
      return NextResponse.json({ error: "Missing userId." }, { status: 400 });
    }

    if (!Number.isInteger(targetYear)) {
      return NextResponse.json({ error: "Invalid targetYear." }, { status: 400 });
    }

    const { data: transactions, error: txError } = await supabaseAdmin
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: true });

    if (txError) {
      return NextResponse.json({ error: txError.message }, { status: 500 });
    }

    const fifoTransactions = (transactions ?? []).map((row: any) => ({
      id: row.id,
      date: new Date(row.date),
      type: row.type,
      asset: row.asset,
      amount: Number(row.amount),
      priceEur: Number(row.price_eur ?? 0),
      feeEur: Number(row.fee_eur ?? 0),
      exchange: row.exchange ?? undefined,
      note: row.raw_csv_row ? JSON.stringify(row.raw_csv_row) : undefined,
    }));

    const result = runFifo(fifoTransactions);
    const filteredSales = result.sales.filter((s) => s.date.getFullYear() === targetYear);

    const totalProfit = Number(
      filteredSales.filter((s) => s.profit > 0).reduce((sum, s) => sum + s.profit, 0).toFixed(8)
    );
    const totalLoss = Number(
      filteredSales.filter((s) => s.profit < 0).reduce((sum, s) => sum + s.profit, 0).toFixed(8)
    );
    const totalTax = Number(
      filteredSales.reduce((sum, s) => sum + s.taxAmount, 0).toFixed(8)
    );

    const sales = filteredSales.map((s) => ({
      date: s.date.toISOString(),
      asset: s.asset,
      amountSold: s.amountSold,
      revenue: s.grossProceeds,
      cost: s.cost,
      profit: s.profit,
      taxAmount: s.taxAmount,
      acquisitionsCount: s.acquisitions ? s.acquisitions.length : 0,
      saleRowsEstimate: (s.acquisitions ? s.acquisitions.length : 0) + 1,
    }));

    return NextResponse.json({
      year: targetYear,
      salesCount: sales.length,
      totalProfit,
      totalLoss,
      totalTax,
      sales,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Server error" }, { status: 500 });
  }
}
