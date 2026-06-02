import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/route-handler";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getTaxpayerProfile } from "@/lib/supabase/profile";
import { buildDohDivSummary, buildDohDivXml, type DivTransaction } from "@/lib/doh-div";

function jsonError(error: string, status = 500) {
  return new NextResponse(JSON.stringify({ success: false, error }), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

// Stolpci ki so vedno prisotni v transactions tabeli
const BASE_COLUMNS = "id,date,type,asset,amount,price_eur,fee_eur,exchange";
// Opcijski stolpci ki so bili dodani kasneje — fallback jih izpusti
const OPTIONAL_COLUMNS = "isin,country_code,payer_name,withholding_tax_eur";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const yearParam = url.searchParams.get("year");
    const validateOnly = url.searchParams.get("validate") === "1";

    if (!yearParam || !/^[0-9]{4}$/.test(yearParam)) {
      return jsonError("Parameter 'year' je obvezen (format: LLLL, npr. 2024)", 400);
    }
    const year = Number(yearParam);

    const { user } = await getAuthenticatedUser();
    if (!user) return jsonError("Niste prijavljeni", 401);

    // Najprej poskusi s polnimi stolpci (vključno z opcijskimi DOH-DIV polji)
    const { data, error: dbError } = await supabaseAdmin
      .from("transactions")
      .select(`${BASE_COLUMNS},${OPTIONAL_COLUMNS}`)
      .eq("user_id", user.id)
      .eq("type", "staking")
      .order("date", { ascending: true });

    let transactions: DivTransaction[];

    if (dbError) {
      // Opcijski stolpci še ne obstajajo v DB — fallback na bazne stolpce
      const { data: fallback, error: fallbackErr } = await supabaseAdmin
        .from("transactions")
        .select(BASE_COLUMNS)
        .eq("user_id", user.id)
        .eq("type", "staking")
        .order("date", { ascending: true });

      if (fallbackErr) {
        return jsonError(`Napaka pri branju transakcij: ${fallbackErr.message}`);
      }
      transactions = (fallback ?? []) as DivTransaction[];
    } else {
      transactions = (data ?? []) as DivTransaction[];
    }

    const summary = buildDohDivSummary(transactions, year);
    const profile = await getTaxpayerProfile(user.id).catch(() => null);

    if (validateOnly) {
      return NextResponse.json({
        success: true,
        year,
        transactionCount: summary.transactionCount,
        entryCount: summary.entries.length,
        totalDividends: summary.totalDividends,
        totalWithheld: summary.totalWithheld,
        totalSlovenianDue: summary.totalSlovenianDue,
        hasIncompleteISIN: summary.hasIncompleteISIN,
        hasIncompleteCountry: summary.hasIncompleteCountry,
        profileComplete: !!(profile?.taxNumber && profile?.fullName),
        entries: summary.entries,
      });
    }

    // XML prenos
    const xml = buildDohDivXml(summary, profile ?? null);
    const headers = new Headers();
    headers.set("Content-Type", "application/xml; charset=utf-8");
    headers.set("Content-Disposition", `attachment; filename="Doh_Div_${year}.xml"`);
    return new NextResponse(xml, { headers });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Interna napaka strežnika";
    console.error("/api/reports/doh-div error:", msg);
    return jsonError(msg);
  }
}
