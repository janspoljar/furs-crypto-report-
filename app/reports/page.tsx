import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import { getFifoForUser } from "@/lib/fifo-server";
import { getSubscription } from "@/lib/subscription";
import TaxpayerProfileStatus from "@/components/taxpayer-profile-status";
import DohDivExportForm from "@/components/doh-div-export-form";
import ReportCardActions from "@/components/report-card-actions";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Poročila | DavkiNaDelnicah.si",
};

interface ReportsPageProps {
  searchParams: Promise<{ year?: string; debug?: string }>;
}

interface AnnualSummaryRow {
  year: number;
  sellCount: number;
  totalGrossProceeds: number;
  totalNetProceeds: number;
  totalGrossCost: number;
  totalNetCost: number;
  realizedProfit: number;
  realizedLoss: number;
  netRealized: number;
  taxEstimate: number;
}

interface NegInventoryDetail {
  asset: string;
  unmatchedQty: number;
  firstSaleDate: Date;
  saleCount: number;
  hasPartialMatch: boolean;
}

function formatCurrency(value: number) {
  return `${value.toFixed(2)} €`;
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const params = await searchParams;
  const user = await requireUser();
  if (!user) {

    redirect("/login");
  }

  const yearFilter = params.year ?? "";
  const debugMode = params.debug === "1";

  const subscription = await getSubscription(user.id);
  const isPro = subscription.isPro;

  const { fifo } = await getFifoForUser(user.id);

  // N2: negative inventory detection
  const negativeInventoryAssets = Array.from(
    new Set(
      fifo.sales.filter((s) => s.unmatchedQuantity > 1e-8).map((s) => s.asset)
    )
  ).sort();

  // N2: detailed negative inventory info
  const negativeInventoryDetails: NegInventoryDetail[] = negativeInventoryAssets.map(asset => {
    const problematicSales = fifo.sales
      .filter(s => s.asset === asset && s.unmatchedQuantity > 1e-8)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
    const unmatchedQty = problematicSales.reduce((sum, s) => sum + s.unmatchedQuantity, 0);
    const hasPartialMatch = problematicSales.some(s => s.matchedQuantity > 0);
    return {
      asset,
      unmatchedQty,
      firstSaleDate: problematicSales[0]?.date ?? new Date(),
      saleCount: problematicSales.length,
      hasPartialMatch,
    };
  });

  const sellYears = Array.from(
    new Set(fifo.sales.map((sale) => sale.date.getFullYear()))
  ).sort((a, b) => b - a);

  const salesForYear = yearFilter
    ? fifo.sales.filter((sale) => sale.date.getFullYear().toString() === yearFilter)
    : fifo.sales;

  const annualSummary: AnnualSummaryRow[] = sellYears.map((year) => {
    const yearSales = fifo.sales.filter((sale) => sale.date.getFullYear() === year);
    const totalGrossProceeds = Number(yearSales.reduce((sum, sale) => sum + sale.grossProceeds, 0).toFixed(2));
    const totalNetProceeds = Number(yearSales.reduce((sum, sale) => sum + sale.netProceeds, 0).toFixed(2));
    const totalGrossCost = Number(yearSales.reduce((sum, sale) => sum + sale.grossCost, 0).toFixed(2));
    const totalNetCost = Number(yearSales.reduce((sum, sale) => sum + sale.netCost, 0).toFixed(2));
    const realizedProfit = Number(yearSales.filter((s) => s.profit > 0).reduce((sum, s) => sum + s.profit, 0).toFixed(2));
    const realizedLoss = Number(yearSales.filter((s) => s.profit < 0).reduce((sum, s) => sum + s.profit, 0).toFixed(2));
    const netRealized = Number((realizedProfit + realizedLoss).toFixed(2));
    const taxEstimate = netRealized > 0 ? Number((netRealized * 0.25).toFixed(2)) : 0;
    return { year, sellCount: yearSales.length, totalGrossProceeds, totalNetProceeds, totalGrossCost, totalNetCost, realizedProfit, realizedLoss, netRealized, taxEstimate };
  });

  // Leta z dividendami + N4 withholding tax check
  let divYears: number[] = [];
  let hasStakingWithoutWithholding = false;
  try {
    const { data: divData } = await supabaseAdmin
      .from("transactions")
      .select("date, fee_eur")
      .eq("user_id", user.id)
      .eq("type", "staking")
      .order("date", { ascending: true });
    if (divData && divData.length > 0) {
      divYears = Array.from(new Set(divData.map((d) => new Date(d.date).getFullYear()))).sort((a, b) => b - a);
      hasStakingWithoutWithholding = divData.some((d) => d.fee_eur === null || d.fee_eur === undefined);
    }
  } catch {
    // ni kritično — DOH-DIV forma bo prazna
  }

  // N3: ECB broker detection
  const CRYPTO_BROKER_NAMES = new Set(["binance", "coinbase", "kraken", "bitstamp"]);
  let hasCryptoBroker = false;
  try {
    const { data: brokerRows } = await supabaseAdmin
      .from("transactions")
      .select("broker")
      .eq("user_id", user.id)
      .not("broker", "is", null);
    hasCryptoBroker = (brokerRows || []).some(
      (r) => r.broker && CRYPTO_BROKER_NAMES.has((r.broker as string).toLowerCase())
    );
  } catch {
    // non-critical
  }

  const totalSells = fifo.sales.length;
  const totalYears = sellYears.length;
  const filteredYearLabel = yearFilter ? ` (${yearFilter})` : "";

  // TASK 1: FURS-ready status panel computation
  const errorCount = negativeInventoryAssets.length;
  const warningCount = hasStakingWithoutWithholding ? 1 : 0;
  type StatusLevel = "ok" | "warn" | "error" | "no-data";
  const statusLevel: StatusLevel =
    annualSummary.length === 0 ? "no-data" :
    errorCount > 0 ? "error" :
    warningCount > 0 ? "warn" : "ok";

  return (
    <main>
      <section className="page-head">
        <div className="wrap">
          <div className="row between" style={{ flexWrap: "wrap", gap: 16, alignItems: "flex-end" }}>
            <div>
              <h1>Davčna poročila</h1>
              <p>Pripravljena uradna poročila za eDavki, ločena po davčnem letu.</p>
            </div>
            <div className="row gap-2" style={{ alignItems: "center" }}>
              <span className="badge badge-free"><span className="dot" />Brezplačni načrt</span>
              <form method="get" style={{ display: "inline-flex" }}>
                <select className="select" name="year" defaultValue={yearFilter} style={{ width: "auto", minWidth: 110 }}>
                  <option value="">Vsa leta</option>
                  {sellYears.map((y) => <option key={y} value={String(y)}>{y}</option>)}
                </select>
                <button type="submit" className="btn btn-line btn-sm" style={{ marginLeft: 6 }}>Filtriraj</button>
                {yearFilter && <a href="/reports" className="btn btn-ghost btn-sm" style={{ marginLeft: 4 }}>×</a>}
              </form>
            </div>
          </div>
        </div>
      </section>

      <section className="wrap" style={{ paddingBottom: 80 }}>
        {/* Pro gate banner */}
        <div className="banner-pro">
          <div className="lt">
            <div className="ic">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <div>
              <strong>XML izvoz je samo za Pro načrt.</strong>
              <p>Poročila lahko pregledaš, a za prenos uradnega XML za eDavki potrebuješ Pro.</p>
            </div>
          </div>
          <a className="btn btn-secondary" href="/cenik">Nadgradi na Pro <span className="arr">→</span></a>
        </div>

        {/* TASK 1: FURS-ready status panel */}
        {statusLevel !== "no-data" && (() => {
          const isOk = statusLevel === "ok";
          const isWarn = statusLevel === "warn";
          const isError = statusLevel === "error";
          const borderColor = isOk ? "var(--pos)" : isWarn ? "var(--warn)" : "var(--neg)";
          const iconBg = isOk ? "rgba(34,197,94,0.12)" : isWarn ? "rgba(234,179,8,0.12)" : "rgba(239,68,68,0.12)";
          const iconColor = isOk ? "var(--pos)" : isWarn ? "var(--warn)" : "var(--neg)";
          const badgeText = isOk ? "Pripravljeno za FURS" : isWarn ? "Pripravljeno z opozorili" : "Ni pripravljeno za FURS";
          const explanation = isOk
            ? "Poročilo je pripravljeno za oddajo na FURS. Prenesite XML in ga uvozite v eDavki."
            : isWarn
            ? "Poročilo je pripravljeno, a nekateri podatki niso popolni. Preverite opozorila pred oddajo."
            : "Najdene so napake, ki blokirajo XML izvoz. Odpravite napake pred oddajo.";

          return (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              gap: 20, flexWrap: "wrap",
              background: "var(--surface)", border: `1px solid ${borderColor}`,
              borderRadius: "var(--r-lg)", padding: "20px 24px",
              marginBottom: 24,
            }}>
              {/* Left side: icon + title + description */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14, flex: 1, minWidth: 0 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: iconBg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  {isOk && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2.5" strokeLinecap="round">
                      <path d="M20 6 9 17l-5-5"/>
                    </svg>
                  )}
                  {isWarn && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                  )}
                  {isError && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                  )}
                </div>
                <div>
                  <div style={{
                    display: "inline-block", fontSize: 11, fontWeight: 700,
                    letterSpacing: "0.05em", textTransform: "uppercase",
                    color: iconColor, marginBottom: 4,
                  }}>
                    {badgeText}
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>
                    {explanation}
                  </p>
                </div>
              </div>
              {/* Right side: counters + CTA */}
              <div style={{ display: "flex", alignItems: "center", gap: 20, flexShrink: 0 }}>
                <div style={{ display: "flex", gap: 16, fontSize: 13 }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: errorCount > 0 ? "var(--neg)" : "var(--muted)", lineHeight: 1 }}>{errorCount}</div>
                    <div style={{ color: "var(--muted)", fontSize: 11, marginTop: 2 }}>Napake</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: warningCount > 0 ? "var(--warn)" : "var(--muted)", lineHeight: 1 }}>{warningCount}</div>
                    <div style={{ color: "var(--muted)", fontSize: 11, marginTop: 2 }}>Opozorila</div>
                  </div>
                </div>
                {errorCount > 0 && (
                  <a href="#neg-inventory" style={{
                    fontSize: 13, fontWeight: 600, color: "var(--neg)",
                    textDecoration: "none", whiteSpace: "nowrap",
                  }}>
                    Preglej napake ↓
                  </a>
                )}
                {errorCount === 0 && warningCount > 0 && (
                  <a href="#div-section" style={{
                    fontSize: 13, fontWeight: 600, color: "var(--warn)",
                    textDecoration: "none", whiteSpace: "nowrap",
                  }}>
                    Preglej opozorila ↓
                  </a>
                )}
              </div>
            </div>
          );
        })()}

        {/* Year cards — DOH-KDVP */}
        <h2 className="h-3" style={{ margin: "28px 0 14px" }}>Doh-KDVP — Kapitalski dobiček od vrednostnih papirjev</h2>

        {/* TASK 2: Enhanced N2 negative inventory diagnostic table */}
        {negativeInventoryAssets.length > 0 && (
          <div id="neg-inventory" className="val-error" style={{ marginBottom: 20, padding: "16px 20px", borderRadius: "var(--r-md)" }}>
            <div className="val-head" style={{ fontSize: 14, marginBottom: 10 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              Negativna zaloga — XML izvoz blokiran
            </div>
            <p style={{ margin: "0 0 14px", fontSize: 13 }}>
              Spodnji ticker{negativeInventoryAssets.length > 1 ? "ji imajo" : " ima"} prodaje brez ustreznih nakupov v sistemu. To onemogoči pravilen FIFO izračun in blokira generiranje XML datoteke.
            </p>

            <div className="tbl-wrap">
              <div className="tbl-scroll">
                <table className="data">
                  <thead>
                    <tr>
                      <th>Ticker</th>
                      <th className="num">Neujeta kol.</th>
                      <th>Prva prodaja</th>
                      <th>Verjetni vzrok</th>
                    </tr>
                  </thead>
                  <tbody>
                    {negativeInventoryDetails.map((detail) => (
                      <tr key={detail.asset}>
                        <td><strong>{detail.asset}</strong></td>
                        <td className="num mono">{detail.unmatchedQty.toFixed(4)}</td>
                        <td>{detail.firstSaleDate.toLocaleDateString("sl-SI", { day: "2-digit", month: "short", year: "numeric" })}</td>
                        <td style={{ fontSize: 12, color: "var(--muted)" }}>
                          {detail.hasPartialMatch
                            ? "Nezaznan split ali manjkajoči CSV"
                            : "Manjkajoči CSV iz preteklih let"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* How to fix card */}
            <div style={{
              background: "var(--surface)", border: "1px solid var(--line)",
              borderRadius: "var(--r-md)", padding: "16px 20px", marginTop: 16,
            }}>
              <strong style={{ fontSize: 13, display: "block", marginBottom: 10 }}>Kako to popravim?</strong>
              <ol style={{ margin: "0 0 10px", paddingLeft: 20, fontSize: 13, lineHeight: 1.9, color: "var(--ink)" }}>
                <li>Uvozite starejše CSV datoteke iz preteklih let</li>
                <li>Preverite split/reverse-split dogodke v izpisku</li>
                <li>Preverite, da ni prišlo do dvojnega uvoza ali manjkajočih nakupov</li>
              </ol>
              <a href="/navodila" style={{ fontSize: 13, color: "var(--accent)", fontWeight: 600 }}>
                Navodila za uvoz in odpravo napak →
              </a>
            </div>
          </div>
        )}

        {annualSummary.length === 0 ? (
          <div className="empty">
            <h3>Ni poročil</h3>
            <p>Naloži CSV izpisek in generiraj prvo poročilo.</p>
            <a href="/upload" className="btn btn-primary">Naloži izpisek</a>
          </div>
        ) : (
          <div className="report-grid">
            {annualSummary.map((row, i) => (
              <article className="report-card" key={row.year} data-report-card>
                <div className="top">
                  <div className="yr">{row.year}</div>
                  <span className="badge badge-pro"><span className="dot" />Pripravljeno</span>
                </div>
                <div className="grid-2">
                  <div>
                    <div className="k">Prodaje</div>
                    <div className="v">{row.sellCount}</div>
                  </div>
                  <div>
                    <div className="k">Skupni dobiček</div>
                    <div className={`v ${row.netRealized >= 0 ? "pos" : "neg"}`}>
                      {row.netRealized >= 0 ? "+" : ""}{row.netRealized.toFixed(2)} €
                    </div>
                  </div>
                </div>
                <div className="grid-2" style={{ borderTop: "none", paddingTop: 0 }}>
                  <div>
                    <div className="k">Ocenjeni davek</div>
                    <div className="v">{row.taxEstimate > 0 ? `${row.taxEstimate.toFixed(2)} €` : "0,00 €"}</div>
                  </div>
                  <div>
                    <div className="k">Realizacije</div>
                    <div className="v" style={{ fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 500 }}>FIFO</div>
                  </div>
                </div>
                <ReportCardActions year={row.year} isPro={isPro} negativeInventoryAssets={negativeInventoryAssets} />
                {!isPro && (
                  <div className="lock-tip">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    XML izvoz je na voljo samo za Pro načrt
                  </div>
                )}
              </article>
            ))}
          </div>
        )}

        {/* N3: ECB info line for crypto users */}
        {hasCryptoBroker && (
          <div style={{
            display: "flex", alignItems: "flex-start", gap: 10,
            background: "var(--surface)", border: "1px solid var(--line)",
            borderRadius: "var(--r-md)", padding: "12px 16px",
            marginTop: 20, fontSize: 13, color: "var(--muted)",
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            <span>Vrednosti so pretvorjene v EUR po referenčnem tečaju ECB na datum transakcije.</span>
          </div>
        )}

        {/* TASK 3: N1 — Upgraded eDavki step-by-step card */}
        <div style={{
          background: "var(--surface)", border: "1px solid var(--line)",
          borderRadius: "var(--r-lg)", padding: "20px 24px",
          marginTop: 28,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: "var(--accent)", flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            <strong style={{ fontSize: 14 }}>Kako oddate XML v eDavke</strong>
          </div>
          <ol style={{ margin: "0 0 14px", paddingLeft: 20, fontSize: 13, lineHeight: 1.9, color: "var(--ink)" }}>
            <li>Prenesite XML datoteko (gumb <strong>Prenesi XML</strong> zgoraj)</li>
            <li>Odprite portal eDavki na spletnem naslovu <strong>edavki.durs.si</strong></li>
            <li>Pojdite na <strong>Dokumenti</strong> → <strong>Uvoz dokumenta</strong></li>
            <li>Izberite preneseno XML datoteko in kliknite <strong>Uvozi</strong></li>
            <li>Preverite uvožen obrazec in kliknite <strong>Oddaj</strong></li>
          </ol>
          <p style={{ margin: "0 0 12px", fontSize: 12, color: "var(--muted)", lineHeight: 1.5 }}>
            XML datoteka mora biti v pravilni FURS strukturi — aplikacija to zagotovi samodejno. Po uvozu lahko podatke v eDavkah še pregledate in popravite pred oddajo.
          </p>
          <a
            href="https://edavki.durs.si/EdavkiPortal/PersonalPortal/[360253]/Pages/Help/sl/Documents_Import.htm"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 12, color: "var(--muted)", textDecoration: "underline" }}
          >
            Pomoč za uvoz dokumentov na eDavki ↗
          </a>
        </div>

        {/* Taxpayer profile status — shown always so user knows what to fill */}
        <div style={{ marginTop: 32 }}>
          <TaxpayerProfileStatus userId={user.id} />
        </div>

        {/* Doh-Div section */}
        <div id="div-section" className="div-section">
          <div className="copy">
            <span className="badge badge-info">Doh-Div</span>
            <h3>Poročilo za dividende</h3>
            <p>Ločena obravnava dividend (25 % dohodnine) s pripadajočo XML datoteko za eDavki. Vključi tudi tuji plačan davek po dvojnem obdavčevanju.</p>
          </div>
          <a className="btn btn-primary" href="/cenik">Odkleni z Pro <span className="arr">→</span></a>
        </div>

        {divYears.length > 0 && (
          <div style={{ marginTop: 24 }}>
            {/* N4: Withholding tax explanation */}
            <div style={{
              background: "var(--surface)", border: "1px solid var(--line)",
              borderRadius: "var(--r-md)", padding: "16px 20px", marginBottom: 16,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: "var(--accent)", flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                <strong style={{ fontSize: 13 }}>Odtegnjeni davek (WHT)</strong>
              </div>
              <p style={{ margin: "0 0 6px", fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>
                Ko je tuj posrednik obračunal davek pri izplačilu dividende ali stakinga, smo ta znesek zabeležili v stolpcu Provizija. FURS ta znesek upošteva pri izračunu dohodnine po sporazumu o izogibanju dvojnega obdavčevanja.
              </p>
              {hasStakingWithoutWithholding && (
                <div style={{
                  display: "flex", alignItems: "flex-start", gap: 8,
                  background: "var(--warn-tint, #fffbeb)", border: "1px solid var(--warn)",
                  borderRadius: "var(--r-sm)", padding: "10px 14px", marginTop: 10,
                  fontSize: 13, color: "var(--warn-ink, #92400e)",
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  <span>Nekatere staking/dividendne transakcije nimajo podatka o odtegnjenem davku. Preverite izpisek posrednika in ročno dopolnite, če je bil davek odtegnjen.</span>
                </div>
              )}
            </div>
            <DohDivExportForm availableYears={divYears} />
          </div>
        )}

        {/* Breakdown preview table */}
        {annualSummary.length > 0 && (
          <>
            <h2 className="h-3" style={{ margin: "56px 0 14px" }}>
              Razčlenitev {annualSummary[0].year} — predogled
            </h2>
            <div className="tbl-wrap">
              <div className="tbl-scroll">
                <table className="data">
                  <thead>
                    <tr>
                      <th>Leto</th>
                      <th className="num">Prodaje</th>
                      <th className="num">Neto izkupiček</th>
                      <th className="num">Neto nabavna vr.</th>
                      <th className="num">Dobiček</th>
                      <th className="num">Izguba</th>
                      <th className="num">Neto P&amp;L</th>
                      <th className="num">Davek (25 %)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {annualSummary.map((row) => (
                      <tr key={row.year}>
                        <td><strong>{row.year}</strong></td>
                        <td className="num mono">{row.sellCount}</td>
                        <td className="num mono">{row.totalNetProceeds.toFixed(2)} €</td>
                        <td className="num mono">{row.totalNetCost.toFixed(2)} €</td>
                        <td className="num mono t-pos">+{row.realizedProfit.toFixed(2)} €</td>
                        <td className="num mono t-neg">{row.realizedLoss.toFixed(2)} €</td>
                        <td className={`num mono ${row.netRealized >= 0 ? "t-pos" : "t-neg"}`}>
                          {row.netRealized >= 0 ? "+" : ""}{row.netRealized.toFixed(2)} €
                        </td>
                        <td className="num mono" style={{ color: row.taxEstimate > 0 ? "var(--warn)" : "var(--muted)" }}>
                          {row.taxEstimate > 0 ? `${row.taxEstimate.toFixed(2)} €` : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
