import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/route-handler";
import { getFifoForUser } from "@/lib/fifo-server";
import { buildExportFromFifo } from "@/lib/report-exporter";
// `doh-kdvp` is imported dynamically below to avoid native module
// loading (libxmljs2) during top-level module evaluation.
import { getTaxpayerProfile } from "@/lib/supabase/profile";
import { canExportXml } from "@/lib/subscription";

function jsonErrorResponse(error: string, details?: unknown, status = 500, failedAt?: string) {
  const payload: Record<string, unknown> = { success: false, error, status };
  if (details !== undefined) payload.details = details;
  if (failedAt) payload.failedAt = failedAt;
  return new NextResponse(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "x-doh-kdvp-error": "1",
    },
  });
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const yearParam = url.searchParams.get("year");
    const validateOnly = url.searchParams.get("validate") === "1";

    // Validate year parameter
    if (yearParam && !/^[0-9]{4}$/.test(yearParam)) {
      return NextResponse.json({ success: false, error: "Invalid year parameter" }, { status: 400 });
    }

    try {
      const { user } = await getAuthenticatedUser();
      if (!user) {
        return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
      }
    } catch (authErr: any) {
      console.error("/api/reports/doh-kdvp/xml auth error:", authErr);
      return NextResponse.json({ success: false, error: "Authentication failed" }, { status: 401 });
    }

    const { user } = await getAuthenticatedUser();
    const year = yearParam ? Number(yearParam) : undefined;

    // Freemium gate: XML export requires Pro plan
    const xmlAccess = await canExportXml(user!.id);
    if (!xmlAccess.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Pro plan required",
          upgradeRequired: true,
          message: "Izvoz XML datoteke je na voljo samo za Pro naročnike. Nadgradite na Pro za 19 €/leto.",
        },
        { status: 403 }
      );
    }

    let fifo, transactions, profile, exportModel, draft, validation;

    try {
      const fifoResult = await getFifoForUser(user!.id);
      fifo = fifoResult.fifo;
      transactions = fifoResult.transactions;
    } catch (fifoErr: any) {
      console.error("/api/reports/doh-kdvp/xml FIFO error:", fifoErr);
      return jsonErrorResponse(
        "FIFO calculation failed",
        fifoErr?.message ?? fifoErr,
        500,
        "fifo-query"
      );
    }

    try {
      profile = await getTaxpayerProfile(user!.id);
    } catch (profileErr: any) {
      console.error("/api/reports/doh-kdvp/xml profile error:", profileErr);
      return jsonErrorResponse(
        "Taxpayer profile fetch failed",
        profileErr?.message ?? profileErr,
        500,
        "profile-fetch"
      );
    }

    // Dynamically import the doh-kdvp module here to avoid any
    // bundler/native-module evaluation at route import time.
    let dohKdvp: typeof import("@/lib/doh-kdvp");
    try {
      dohKdvp = await import("@/lib/doh-kdvp");
    } catch (buildErr: any) {
      console.error("/api/reports/doh-kdvp/xml doh-kdvp import error:", buildErr);
      return jsonErrorResponse(
        "Failed to load doh-kdvp module",
        buildErr?.message ?? buildErr,
        500,
        "doh-kdvp-import"
      );
    }

    try {
      exportModel = buildExportFromFifo(fifo, year);
      draft = dohKdvp.buildDohKdvpDraftFromExport(exportModel, { year, fifo, transactions, taxpayer: profile ?? undefined });
      validation = dohKdvp.validateDohKdvpDraft(draft);
    } catch (buildErr: any) {
      console.error("/api/reports/doh-kdvp/xml build error:", buildErr);
      return jsonErrorResponse(
        "Draft build failed",
        buildErr?.message ?? buildErr,
        500,
        "draft-build"
      );
    }

    // If validation-only mode, ensure validator dependency is available and return JSON summary
    if (validateOnly) {
      const validatorAvailability = await dohKdvp.ensureXmlValidatorAvailable();
      if (!validatorAvailability.valid) {
        return jsonErrorResponse(
          "XML validator dependency unavailable",
          validatorAvailability.error,
          500,
          "validator-availability"
        );
      }

      const yearSales = year
        ? fifo.sales.filter((s) => s.date.getFullYear() === year)
        : fifo.sales;
      const hasMissingISIN = draft.instruments.some((instr) => !instr.isin);
      const hasUnmatchedQty = draft.instruments.some((instr) =>
        instr.disposals.some((d) => d.unmatchedQuantity && d.unmatchedQuantity > 0)
      );
      const netRealized = yearSales.reduce((sum, s) => sum + s.profit, 0);

      return NextResponse.json({
        success: validation.errors.length === 0,
        year: year ?? null,
        reportYear: draft.reportYear,
        sellCount: yearSales.length,
        netRealized: Number(netRealized.toFixed(2)),
        hasMissingISIN,
        hasUnmatchedQty,
        profileComplete: !!(profile?.taxNumber && profile?.fullName),
        validation,
      });
    }

    // XML download mode - check if validation allows XML generation
    if (validation.errors.length > 0) {
      return NextResponse.json({
        success: false,
        error: "Draft validation failed",
        validation,
      }, { status: 400 });
    }

    // Serialize to XML
    const xmlResult = dohKdvp.serializeDohKdvpDraftToXml(draft);

    if (!xmlResult.success) {
      return jsonErrorResponse(
        "XML serialization failed",
        { serialization_error: xmlResult.error, validation },
        500,
        "xml-serialize"
      );
    }

    const schemaValidation = await dohKdvp.validateDohKdvpXml(xmlResult.xml!);
    if (!schemaValidation.valid) {
      if (schemaValidation.validatorError) {
        console.warn("/api/reports/doh-kdvp/xml validator unavailable, skipping schema validation:", schemaValidation.validatorError);
      } else {
        return jsonErrorResponse(
          "XML schema validation failed",
          { validation, schemaValidation },
          400,
          "xml-schema-validation"
        );
      }
    }

    // Return XML with proper content-type and download headers
    const headers = new Headers();
    headers.set("Content-Type", "application/xml; charset=utf-8");
    headers.set("Content-Disposition", `attachment; filename="Doh_KDVP_${year || "all"}.xml"`);

    return new NextResponse(xmlResult.xml, { headers });
  } catch (err: any) {
    const errorMessage = err?.message ?? "Internal server error";
    const details = err?.stack ?? err;
    console.error("/api/reports/doh-kdvp/xml error:", { errorMessage, details });
    return jsonErrorResponse(errorMessage, details, 500);
  }
}
