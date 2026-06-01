import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/route-handler";
import { getFifoForUser } from "@/lib/fifo-server";
import { buildExportFromFifo } from "@/lib/report-exporter";
import { buildDohKdvpDraftFromExport, validateDohKdvpDraft } from "@/lib/doh-kdvp";
import { getTaxpayerProfile } from "@/lib/supabase/profile";

export async function GET(request: Request) {
  try {
    const { user } = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    const url = new URL(request.url);
    const yearParam = url.searchParams.get("year");

    if (yearParam && !/^[0-9]{4}$/.test(yearParam)) {
      return NextResponse.json({ success: false, error: "Invalid year parameter" }, { status: 400 });
    }

    const year = yearParam ? Number(yearParam) : undefined;

    const { fifo, transactions } = await getFifoForUser(user.id, year ? undefined : undefined);
    const profile = await getTaxpayerProfile(user.id);

    const exportModel = buildExportFromFifo(fifo, year);

    const draft = buildDohKdvpDraftFromExport(exportModel, { year, fifo, transactions, taxpayer: profile ?? undefined });

    const validation = validateDohKdvpDraft(draft);

    return NextResponse.json({ success: true, year: year ?? null, draft, validation });
  } catch (err: any) {
    console.error("/api/reports/doh-kdvp error:", err);
    return NextResponse.json({ success: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}
