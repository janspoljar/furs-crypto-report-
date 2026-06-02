import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getAuthenticatedUser } from "@/lib/supabase/route-handler";
import { getTaxpayerProfile } from "@/lib/supabase/profile";
import { runFifo } from "@/lib/fifo";
import { generateXml } from "@/lib/xmlGenerator";

export async function POST(req: Request) {
  try {
    const { user: authUser, error: authError } = await getAuthenticatedUser();
    if (authError || !authUser?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const targetYear = Number(body.targetYear);
    const userId = authUser.id;

    if (!Number.isInteger(targetYear) || targetYear < 2000 || targetYear > 2100) {
      return NextResponse.json(
        { error: "Manjka veljavno targetYear." },
        { status: 400 }
      );
    }

    const profile = await getTaxpayerProfile(userId);
    if (!profile) {
      return NextResponse.json(
        { error: "Najprej izpolni davčni profil." },
        { status: 400 }
      );
    }

    const { data: transactions, error: txError } = await supabaseAdmin
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: true });

    if (txError) {
      return NextResponse.json(
        { error: txError.message },
        { status: 500 }
      );
    }

    const fifoTransactions = (transactions ?? []).map((row) => ({
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

    const filteredSales = result.sales.filter(
      (sale) => sale.date.getFullYear() === targetYear
    );

    const filteredResult = {
      ...result,
      sales: filteredSales,
      totalProfit: filteredSales
        .filter((sale) => sale.profit > 0)
        .reduce((sum, sale) => sum + sale.profit, 0),
      totalLoss: filteredSales
        .filter((sale) => sale.profit < 0)
        .reduce((sum, sale) => sum + sale.profit, 0),
      totalTax: filteredSales
        .reduce((sum, sale) => sum + sale.taxAmount, 0),
    };

    const xml = generateXml(filteredResult, {
      taxNumber: profile.taxNumber,
      name: profile.fullName,
      address: `${profile.address}, ${profile.postalCode} ${profile.city}`,
      year: targetYear,
    });

    return new Response(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Content-Disposition": `attachment; filename=furs-report-${targetYear}.xml`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Napaka pri generiranju XML.",
      },
      { status: 500 }
    );
  }
}