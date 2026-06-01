import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { runFifo } from "@/lib/fifo";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userId = body.userId as string | undefined;

    if (!userId) {
      return NextResponse.json(
        { error: "Manjka userId." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const fifoTransactions = (data ?? []).map((row) => ({
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

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Napaka pri calculate.",
      },
      { status: 500 }
    );
  }
}