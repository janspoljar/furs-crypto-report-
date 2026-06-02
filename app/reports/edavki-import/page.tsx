import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import { getSubscription } from "@/lib/subscription";
import { getTaxpayerProfile } from "@/lib/supabase/profile";
import { getFifoForUser } from "@/lib/fifo-server";
import { buildExportFromFifo } from "@/lib/report-exporter";
import EdavkiImportView from "@/components/edavki-import-view";

export const metadata: Metadata = {
  title: "Preusmeritev v eDavke | DavkiNaDelnicah.si",
  robots: { index: false, follow: false },
};

interface PageProps {
  searchParams: Promise<{ year?: string }>;
}

export default async function EdavkiImportPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const user = await requireUser();

  const subscription = await getSubscription(user.id);
  if (!subscription.isPro) redirect("/cenik");

  const yearRaw = params.year;
  const year = yearRaw ? Number(yearRaw) : NaN;
  if (!yearRaw || isNaN(year) || year < 2018 || year > 2030) {
    redirect("/reports");
  }

  const profile = await getTaxpayerProfile(user.id);

  if (!profile?.taxNumber) {
    return (
      <main>
        <section className="page-head">
          <div className="wrap">
            <h1>Preusmeritev v eDavke</h1>
            <p>Neposredni prenos XML v eDavke za leto {year}.</p>
          </div>
        </section>
        <section className="wrap" style={{ paddingBottom: 80 }}>
          <div style={{
            maxWidth: 560, margin: "0 auto",
            background: "var(--error-tint, rgba(239,68,68,0.06))",
            border: "1px solid var(--neg)",
            borderRadius: "var(--r-lg)", padding: "24px 28px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--neg)" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <strong style={{ color: "var(--neg)", fontSize: 14 }}>Manjka davčna številka</strong>
            </div>
            <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>
              Za neposreden prenos v eDavke je potrebna vaša davčna številka. Brez nje eDavki ne more identificirati zavezanca.
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <a href="/account" className="btn btn-primary btn-sm">
                Dopolni podatke →
              </a>
              <a href="/reports" className="btn btn-line btn-sm">
                Nazaj na poročila
              </a>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const { fifo, transactions } = await getFifoForUser(user.id);

  // Block if negative inventory would make XML invalid
  const negativeInventoryAssets = Array.from(
    new Set(fifo.sales.filter((s) => s.unmatchedQuantity > 1e-8).map((s) => s.asset))
  ).sort();

  if (negativeInventoryAssets.length > 0) {
    redirect(`/reports?importError=negative_inventory`);
  }

  // Generate XML — dynamic import mirrors the XML route pattern
  let xmlString: string;
  try {
    const dohKdvp = await import("@/lib/doh-kdvp");
    const exportModel = buildExportFromFifo(fifo, year);
    const draft = dohKdvp.buildDohKdvpDraftFromExport(exportModel, {
      year,
      fifo,
      transactions,
      taxpayer: profile,
    });
    const result = dohKdvp.serializeDohKdvpDraftToXml(draft);
    if (!result.success || !result.xml) {
      redirect(`/reports?importError=xml_generation`);
    }
    xmlString = result.xml;
  } catch {
    redirect(`/reports?importError=xml_generation`);
  }

  // UTF-8 Base64 for eDavki POST field
  const xmlBase64 = Buffer.from(xmlString, "utf-8").toString("base64");

  const taxNum = profile.taxNumber;
  const maskedTaxId =
    taxNum.length >= 4 ? taxNum.slice(0, 2) + "••••" + taxNum.slice(-2) : "••••••••";

  const actionUrl =
    process.env.EDAVKI_IMPORT_URL ??
    "https://edavki.durs.si/EdavkiPortal/PersonalPortal/Pages/Login/Login.aspx";

  return (
    <main>
      <section className="page-head">
        <div className="wrap">
          <h1>Preusmerjamo vas v eDavke</h1>
          <p>
            Vaš XML bomo poslali neposredno v eDavke prek uradnega uvoznega obrazca. Nato se
            boste prijavili in pregledali uvožene podatke pred oddajo.
          </p>
        </div>
      </section>

      <section className="wrap" style={{ paddingBottom: 80 }}>
        <EdavkiImportView
          xmlBase64={xmlBase64}
          taxPayerId={taxNum}
          maskedTaxId={maskedTaxId}
          year={year}
          actionUrl={actionUrl}
        />
      </section>
    </main>
  );
}
