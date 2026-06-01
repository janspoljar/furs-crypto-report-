import { supabaseAdmin } from "@/lib/supabase/admin";
import { runFifo, Transaction as FifoTransaction, FifoResult } from "./fifo";

interface DbTransactionRow {
  id: string;
  date: string | Date;
  type: string;
  asset: string;
  amount: string | number;
  price_eur: string | number;
  fee_eur: string | number | null;
  exchange: string | null;
  note: string | null;
}

export async function getFifoForUser(userId: string, asset?: string): Promise<{ fifo: FifoResult; transactions: FifoTransaction[] }> {
  const query = supabaseAdmin
    .from<DbTransactionRow>("transactions")
    .select("id,date,type,asset,amount,price_eur,fee_eur,exchange,note")
    .eq("user_id", userId)
    .order("date", { ascending: true });

  if (asset) {
    query.eq("asset", asset);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  const transactions: FifoTransaction[] = (data || []).map((row) => ({
    id: row.id,
    date: new Date(row.date),
    type: row.type as FifoTransaction["type"],
    asset: row.asset,
    amount: Number(row.amount ?? 0),
    priceEur: Number(row.price_eur ?? 0),
    feeEur: row.fee_eur !== null && row.fee_eur !== undefined ? Number(row.fee_eur) : undefined,
    exchange: row.exchange ?? undefined,
    note: row.note ?? undefined,
  }));

  const fifo = runFifo(transactions);
  return { fifo, transactions };
}
