import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/route-handler";
import { getFifoForUser } from "@/lib/fifo-server";
import { buildExportFromFifo } from "@/lib/report-exporter";

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

    const { fifo } = await getFifoForUser(user.id);

    const exportModel = buildExportFromFifo(fifo, year);

    return NextResponse.json({ success: true, year: year ?? null, report: exportModel });
  } catch (err: any) {
    console.error("/api/reports/yearly error:", err);
    return NextResponse.json({ success: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}
