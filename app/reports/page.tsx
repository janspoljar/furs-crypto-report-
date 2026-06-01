import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import { getFifoForUser } from "@/lib/fifo-server";
import TaxpayerProfileStatus from "@/components/taxpayer-profile-status";
import DohKdvpExportForm from "@/components/doh-kdvp-export-form";

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

  const { fifo } = await getFifoForUser(user.id);

  const sellYears = Array.from(
    new Set(fifo.sales.map((sale) => sale.date.getFullYear()))
  ).sort((a, b) => b - a);

  const salesForYear = yearFilter
    ? fifo.sales.filter((sale) => sale.date.getFullYear().toString() === yearFilter)
    : fifo.sales;

  const annualSummary = sellYears.map((year) => {
    const yearSales = fifo.sales.filter((sale) => sale.date.getFullYear() === year);
    const totalGrossProceeds = Number(
      yearSales.reduce((sum, sale) => sum + sale.grossProceeds, 0).toFixed(2)
    );
    const totalNetProceeds = Number(
      yearSales.reduce((sum, sale) => sum + sale.netProceeds, 0).toFixed(2)
    );
    const totalGrossCost = Number(
      yearSales.reduce((sum, sale) => sum + sale.grossCost, 0).toFixed(2)
    );
    const totalNetCost = Number(
      yearSales.reduce((sum, sale) => sum + sale.netCost, 0).toFixed(2)
    );
    const realizedProfit = Number(
      yearSales.filter((sale) => sale.profit > 0).reduce((sum, sale) => sum + sale.profit, 0).toFixed(2)
    );
    const realizedLoss = Number(
      yearSales.filter((sale) => sale.profit < 0).reduce((sum, sale) => sum + sale.profit, 0).toFixed(2)
    );
    const netRealized = Number((realizedProfit + realizedLoss).toFixed(2));
    const taxEstimate = netRealized > 0 ? Number((netRealized * 0.25).toFixed(2)) : 0;

    return {
      year,
      sellCount: yearSales.length,
      totalGrossProceeds,
      totalNetProceeds,
      totalGrossCost,
      totalNetCost,
      realizedProfit,
      realizedLoss,
      netRealized,
      taxEstimate,
    };
  });

  const totalSells = fifo.sales.length;
  const totalYears = sellYears.length;
  const filteredYearLabel = yearFilter ? ` (${yearFilter})` : "";

  // Agregate dividende/staking transakcije za DOH-DIV prikaz
  // (placeholder — dejanski podatki bodo, ko bo DOH-DIV endpoint implementiran)
  const hasDividends = false; // TODO: preberi iz supabase ko bo endpoint

  return (
    <main style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
      <h1>Letna davčna poročila</h1>
      <p style={{ color: "#666", marginTop: 8 }}>
        Pregled realiziranih prodaj po FIFO modelu in izvoz za eDavke.
      </p>

      {/* Skupni KPI-ji */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginTop: 24, marginBottom: 32 }}>
        <div style={{ padding: 16, backgroundColor: "#f0f0f0", borderRadius: 8 }}>
          <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>Skupaj prodaj</div>
          <div style={{ fontSize: 28, fontWeight: "bold", color: "#333" }}>{totalSells}</div>
        </div>
        <div style={{ padding: 16, backgroundColor: "#eef", borderRadius: 8 }}>
          <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>Leta z realizacijami</div>
          <div style={{ fontSize: 28, fontWeight: "bold", color: "#333" }}>{totalYears}</div>
        </div>
        <div style={{ padding: 16, backgroundColor: "#fff7e6", borderRadius: 8 }}>
          <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>Model izračuna</div>
          <div style={{ fontSize: 18, fontWeight: "bold", color: "#555" }}>FIFO (nakup/prodaja)</div>
        </div>
      </section>

      <div style={{ padding: 16, backgroundColor: "#fff7e6", borderRadius: 8, border: "1px solid #f2d6a0", marginBottom: 24 }}>
        <p style={{ margin: 0, color: "#333" }}>
          <strong>Opomba:</strong> Trenutna logika upošteva le nakup/prodaja transakcije in provizije. Dividende, obresti, transferji, dvigi in pologi trenutno niso vključeni v DOH-KDVP izračun.
        </p>
      </div>

      <form method="get" style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          Davčno leto
          <select name="year" defaultValue={yearFilter} style={{ padding: 10, borderRadius: 6, border: "1px solid #ccc" }}>
            <option value="">Vsa leta</option>
            {sellYears.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          Razhroščevanje
          <select name="debug" defaultValue={debugMode ? "1" : "0"} style={{ padding: 10, borderRadius: 6, border: "1px solid #ccc" }}>
            <option value="0">Izklopljeno</option>
            <option value="1">Vklopljeno</option>
          </select>
        </label>
        <button type="submit" style={{ padding: "10px 16px", borderRadius: 6, border: "none", backgroundColor: "#0066cc", color: "white", cursor: "pointer" }}>
          Osveži
        </button>
      </form>

      {/* Tabela letnih povzetkov */}
      <section style={{ overflowX: "auto", marginBottom: 40 }}>
        <h2 style={{ marginBottom: 12 }}>DOH-KDVP — Letni povzetki</h2>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ backgroundColor: "#f5f5f5", borderBottom: "2px solid #ddd" }}>
              <th style={{ padding: 12, textAlign: "left" }}>Leto</th>
              <th style={{ padding: 12, textAlign: "right" }}>Št. prodaj</th>
              <th style={{ padding: 12, textAlign: "right" }}>Bruto izkupiček</th>
              <th style={{ padding: 12, textAlign: "right" }}>Neto izkupiček</th>
              <th style={{ padding: 12, textAlign: "right" }}>Bruto nabavna vr.</th>
              <th style={{ padding: 12, textAlign: "right" }}>Neto nabavna vr.</th>
              <th style={{ padding: 12, textAlign: "right" }}>Dobiček</th>
              <th style={{ padding: 12, textAlign: "right" }}>Izguba</th>
              <th style={{ padding: 12, textAlign: "right" }}>Neto P&amp;L</th>
              <th style={{ padding: 12, textAlign: "right", color: "#b45309" }}>Davek (25%)</th>
            </tr>
          </thead>
          <tbody>
            {annualSummary.map((row) => (
              <tr key={row.year} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: 12, fontWeight: 600 }}>{row.year}</td>
                <td style={{ padding: 12, textAlign: "right" }}>{row.sellCount}</td>
                <td style={{ padding: 12, textAlign: "right" }}>{formatCurrency(row.totalGrossProceeds)}</td>
                <td style={{ padding: 12, textAlign: "right" }}>{formatCurrency(row.totalNetProceeds)}</td>
                <td style={{ padding: 12, textAlign: "right" }}>{formatCurrency(row.totalGrossCost)}</td>
                <td style={{ padding: 12, textAlign: "right" }}>{formatCurrency(row.totalNetCost)}</td>
                <td style={{ padding: 12, textAlign: "right", color: "#16a34a" }}>{formatCurrency(row.realizedProfit)}</td>
                <td style={{ padding: 12, textAlign: "right", color: "#dc2626" }}>{formatCurrency(Math.abs(row.realizedLoss))}</td>
                <td style={{ padding: 12, textAlign: "right", fontWeight: 600, color: row.netRealized >= 0 ? "#16a34a" : "#dc2626" }}>{formatCurrency(row.netRealized)}</td>
                <td style={{ padding: 12, textAlign: "right", color: row.taxEstimate > 0 ? "#b45309" : "#888", fontWeight: row.taxEstimate > 0 ? 600 : 400 }}>
                  {row.taxEstimate > 0 ? formatCurrency(row.taxEstimate) : "—"}
                </td>
              </tr>
            ))}
            {annualSummary.length === 0 && (
              <tr>
                <td colSpan={10} style={{ padding: 24, textAlign: "center", color: "#666" }}>
                  Ni realiziranih prodaj za prikaz.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {/* DOH-DIV sekcija */}
      <section style={{ marginBottom: 40 }}>
        <h2 style={{ marginBottom: 8 }}>DOH-DIV — Dividende in obresti</h2>
        <div style={{ padding: 16, backgroundColor: "#f0fdf4", borderRadius: 8, border: "1px solid #86efac", marginBottom: 16 }}>
          <p style={{ margin: 0, color: "#166534", fontSize: 14, lineHeight: 1.6 }}>
            <strong>Zakaj je to pomembno:</strong> Dividende iz tujih vrednostnih papirjev in obresti iz kriptovalut (staking, lending)
            so v Sloveniji obdavčene z dohodnino — ločeno od kapitalskih dobičkov (DOH-KDVP). Oddati je treba ločen obrazec <strong>DOH-DIV</strong> na eDavke.
          </p>
        </div>
        <div style={{ padding: 16, backgroundColor: hasDividends ? "#fff" : "#fafaf9", borderRadius: 8, border: "1px solid #e5e7eb" }}>
          {hasDividends ? (
            <p style={{ color: "#333" }}>Tu bodo prikazane dividende in staking nagrade.</p>
          ) : (
            <div>
              <p style={{ color: "#666", marginBottom: 12, fontSize: 14 }}>
                Transakcije tipa <strong>dividenda/staking</strong> so uvožene, a DOH-DIV izvoz še ni implementiran.
              </p>
              <div style={{ fontSize: 13, color: "#555", lineHeight: 1.8 }}>
                <strong>Naslednji koraki za DOH-DIV:</strong>
                <ol style={{ marginTop: 8, paddingLeft: 20 }}>
                  <li>Pregled uvoženih dividend in staking nagrad v zavihku <a href="/transactions?type=staking">Transakcije → Dividend/Interest</a></li>
                  <li>Zbiranje podatkov o plačniku (naziv podjetja, ISIN, država vira)</li>
                  <li>Izvoz XML za eDavke (obrazec DOH-DIV) — v pripravi</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </section>

      <TaxpayerProfileStatus userId={user.id} />

      <DohKdvpExportForm availableYears={sellYears} />

      {debugMode && (
        <section style={{ padding: 16, backgroundColor: "#f3f7ff", borderRadius: 8, border: "1px solid #c8d7ff", marginTop: 32 }}>
          <h2 style={{ marginTop: 0 }}>FIFO prodaje — surovi podatki{filteredYearLabel}</h2>
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: 12, color: "#333" }}>
            {JSON.stringify(salesForYear, null, 2)}
          </pre>
        </section>
      )}
    </main>
  );
}
