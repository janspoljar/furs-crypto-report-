import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/route-handler";
import { getFifoForUser } from "@/lib/fifo-server";

export interface OrphanAsset {
  asset: string;
  years: number[];
  unmatchedQuantity: number;
}

export async function GET() {
  try {
    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fifo } = await getFifoForUser(user.id);

    const orphanMap = new Map<string, { years: Set<number>; qty: number }>();

    for (const sale of fifo.sales) {
      if (sale.unmatchedQuantity > 0) {
        const key = sale.asset.toUpperCase();
        if (!orphanMap.has(key)) orphanMap.set(key, { years: new Set(), qty: 0 });
        const entry = orphanMap.get(key)!;
        entry.years.add(sale.date.getFullYear());
        entry.qty += sale.unmatchedQuantity;
      }
    }

    const orphans: OrphanAsset[] = Array.from(orphanMap.entries()).map(([asset, { years, qty }]) => ({
      asset,
      years: Array.from(years).sort(),
      unmatchedQuantity: Math.round(qty * 10000) / 10000,
    }));

    return NextResponse.json({ orphans });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Napaka." },
      { status: 500 }
    );
  }
}
