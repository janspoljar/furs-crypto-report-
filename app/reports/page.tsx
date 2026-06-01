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
    };
  });

  const totalSells = fifo.sales.length;
  const totalYears = sellYears.length;
  const filteredYearLabel = yearFilter ? ` (${yearFilter})` : "";

  return (
    <main style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
      <h1>Letni tax report</h1>
      <p style={{ color: "#666", marginTop: 8 }}>
        Osnovni letni pregled realiziranih prodaj po FIFO buy/sell modelu.
      </p>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginTop: 24, marginBottom: 32 }}>
        <div style={{ padding: 16, backgroundColor: "#f0f0f0", borderRadius: 8 }}>
          <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>Skupaj prodaj</div>
          <div style={{ fontSize: 28, fontWeight: "bold", color: "#333" }}>{totalSells}</div>
        </div>
        <div style={{ padding: 16, backgroundColor: "#eef", borderRadius: 8 }}>
          <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>Leta z prodajami</div>
          <div style={{ fontSize: 28, fontWeight: "bold", color: "#333" }}>{totalYears}</div>
        </div>
        <div style={{ padding: 16, backgroundColor: "#fff7e6", borderRadius: 8 }}>
          <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>Podprt model</div>
          <div style={{ fontSize: 18, fontWeight: "bold", color: "#555" }}>Buy/Sell FIFO</div>
        </div>
      </section>

      <div style={{ padding: 16, backgroundColor: "#fff7e6", borderRadius: 8, border: "1px solid #f2d6a0", marginBottom: 24 }}>
        <p style={{ margin: 0, color: "#333" }}>
          Trenutna logika upošteva le buy/sell transakcije in fees. Dividend, interest, transfer, deposit in withdrawal trenutno niso vključeni.
        </p>
      </div>

      <form method="get" style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          Filter leto
          <select name="year" defaultValue={yearFilter} style={{ padding: 10, borderRadius: 6, border: "1px solid #ccc" }}>
            <option value="">Vse</option>
            {sellYears.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          Debug mode
          <select name="debug" defaultValue={debugMode ? "1" : "0"} style={{ padding: 10, borderRadius: 6, border: "1px solid #ccc" }}>
            <option value="0">Off</option>
            <option value="1">On</option>
          </select>
        </label>
        <button type="submit" style={{ padding: "10px 16px", borderRadius: 6, border: "none", backgroundColor: "#0066cc", color: "white", cursor: "pointer" }}>
          Osveži
        </button>
      </form>

      <section style={{ overflowX: "auto", marginBottom: 32 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ backgroundColor: "#f5f5f5", borderBottom: "2px solid #ddd" }}>
              <th style={{ padding: 12, textAlign: "left" }}>Leto</th>
              <th style={{ padding: 12, textAlign: "right" }}>Št. prodaj</th>
              <th style={{ padding: 12, textAlign: "right" }}>Gross proceeds</th>
              <th style={{ padding: 12, textAlign: "right" }}>Net proceeds</th>
              <th style={{ padding: 12, textAlign: "right" }}>Gross cost</th>
              <th style={{ padding: 12, textAlign: "right" }}>Net cost</th>
              <th style={{ padding: 12, textAlign: "right" }}>Profit</th>
              <th style={{ padding: 12, textAlign: "right" }}>Loss</th>
              <th style={{ padding: 12, textAlign: "right" }}>Net realized</th>
            </tr>
          </thead>
          <tbody>
            {annualSummary.map((row) => (
              <tr key={row.year} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: 12 }}>{row.year}</td>
                <td style={{ padding: 12, textAlign: "right" }}>{row.sellCount}</td>
                <td style={{ padding: 12, textAlign: "right" }}>{formatCurrency(row.totalGrossProceeds)}</td>
                <td style={{ padding: 12, textAlign: "right" }}>{formatCurrency(row.totalNetProceeds)}</td>
                <td style={{ padding: 12, textAlign: "right" }}>{formatCurrency(row.totalGrossCost)}</td>
                <td style={{ padding: 12, textAlign: "right" }}>{formatCurrency(row.totalNetCost)}</td>
                <td style={{ padding: 12, textAlign: "right", color: "#060" }}>{formatCurrency(row.realizedProfit)}</td>
                <td style={{ padding: 12, textAlign: "right", color: "#c00" }}>{formatCurrency(Math.abs(row.realizedLoss))}</td>
                <td style={{ padding: 12, textAlign: "right" }}>{formatCurrency(row.netRealized)}</td>
              </tr>
            ))}
            {annualSummary.length === 0 && (
              <tr>
                <td colSpan={9} style={{ padding: 24, textAlign: "center", color: "#666" }}>
                  Ni realiziranih sell transakcij za prikaz.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <TaxpayerProfileStatus userId={user.id} />

      <DohKdvpExportForm availableYears={sellYears} />

      {debugMode && (
        <section style={{ padding: 16, backgroundColor: "#f3f7ff", borderRadius: 8, border: "1px solid #c8d7ff" }}>
          <h2 style={{ marginTop: 0 }}>Raw FIFO sell results{filteredYearLabel}</h2>
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: 12, color: "#333" }}>
            {JSON.stringify(salesForYear, null, 2)}
          </pre>
        </section>
      )}
    </main>
  );
}
