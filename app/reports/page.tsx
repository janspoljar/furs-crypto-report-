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

  // Leta z dividendami (za DOH-DIV formo)
  let divYears: number[] = [];
  try {
    const { data: divData } = await supabaseAdmin
      .from("transactions")
      .select("date")
      .eq("user_id", user.id)
      .eq("type", "staking")
      .order("date", { ascending: true });
    if (divData && divData.length > 0) {
      divYears = Array.from(new Set(divData.map((d) => new Date(d.date).getFullYear()))).sort((a, b) => b - a);
    }
  } catch {
    // ni kritično — DOH-DIV forma bo prazna
  }

  const totalSells = fifo.sales.length;
  const totalYears = sellYears.length;
  const filteredYearLabel = yearFilter ? ` (${yearFilter})` : "";

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

        {/* Year cards — DOH-KDVP */}
        <h2 className="h-3" style={{ margin: "28px 0 14px" }}>Doh-KDVP — Kapitalski dobiček od vrednostnih papirjev</h2>

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
                <ReportCardActions year={row.year} isPro={isPro} />
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

        {/* Taxpayer profile status — shown always so user knows what to fill */}
        <div style={{ marginTop: 32 }}>
          <TaxpayerProfileStatus userId={user.id} />
        </div>

        {/* Doh-Div section */}
        <div className="div-section">
          <div className="copy">
            <span className="badge badge-info">Doh-Div</span>
            <h3>Poročilo za dividende</h3>
            <p>Ločena obravnava dividend (25 % dohodnine) s pripadajočo XML datoteko za eDavki. Vključi tudi tuji plačan davek po dvojnem obdavčevanju.</p>
          </div>
          <a className="btn btn-primary" href="/cenik">Odkleni z Pro <span className="arr">→</span></a>
        </div>

        {divYears.length > 0 && (
          <div style={{ marginTop: 24 }}>
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
