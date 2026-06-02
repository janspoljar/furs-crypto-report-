"use server";

import { requireUser } from "@/lib/supabase/server";
import { getFifoForUser } from "@/lib/fifo-server";
import { buildExportFromFifo } from "@/lib/report-exporter";
import { buildDohKdvpDraftFromExport, serializeDohKdvpDraftToXml } from "@/lib/doh-kdvp";
import { getTaxpayerProfile } from "@/lib/supabase/profile";
import { validateDohKdvp, type XmlValidationResult } from "@/lib/xml-validator";
import { getSubscription } from "@/lib/subscription";
import {
  getReportSubmissions,
  upsertReportSubmission,
  deleteReportSubmission,
} from "@/lib/supabase/submissions";

export interface ValidateXmlResult {
  ok: boolean;
  gated: boolean;        // true when blocked by Free plan
  validation: XmlValidationResult | null;
  xmlPreview: string | null; // first 500 chars for debugging, null in prod
  error: string | null;
}

export async function validateReportXml(year: number): Promise<ValidateXmlResult> {
  const user = await requireUser();

  const subscription = await getSubscription(user.id);
  if (!subscription.isPro) {
    return { ok: false, gated: true, validation: null, xmlPreview: null, error: null };
  }

  try {
    const { fifo, transactions } = await getFifoForUser(user.id);
    const profile = await getTaxpayerProfile(user.id);
    const exportModel = buildExportFromFifo(fifo, year);
    const draft = buildDohKdvpDraftFromExport(exportModel, {
      year,
      fifo,
      transactions,
      taxpayer: profile ?? undefined,
    });

    const serialize = serializeDohKdvpDraftToXml(draft);
    if (!serialize.success || !serialize.xml) {
      return {
        ok: false,
        gated: false,
        validation: { valid: false, errors: [serialize.error ?? "Napaka pri generiranju XML."], warnings: [] },
        xmlPreview: null,
        error: null,
      };
    }

    const validation = validateDohKdvp(serialize.xml);
    return {
      ok: true,
      gated: false,
      validation,
      xmlPreview: null,
      error: null,
    };
  } catch (err: unknown) {
    return {
      ok: false,
      gated: false,
      validation: null,
      xmlPreview: null,
      error: err instanceof Error ? err.message : "Neznana napaka.",
    };
  }
}

export interface ToggleSubmissionResult {
  submittedAt: string | null;
}

export async function toggleReportSubmission(
  year: number
): Promise<ToggleSubmissionResult> {
  const user = await requireUser();

  const subscription = await getSubscription(user.id);
  if (!subscription.isPro) {
    throw new Error("Pro naročnina je potrebna.");
  }

  const existing = await getReportSubmissions(user.id);
  const currentSubmittedAt = existing.get(year);

  if (currentSubmittedAt) {
    await deleteReportSubmission(user.id, year);
    return { submittedAt: null };
  } else {
    await upsertReportSubmission(user.id, year);
    return { submittedAt: new Date().toISOString() };
  }
}
