import { getUserFromServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getFifoForUser } from "@/lib/fifo-server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getUserSubscription, FREE_TX_LIMIT } from "@/lib/subscription";

export default async function DashboardPage() {
  const { user, error } = await getUserFromServer();

  if (error || !user) {
    redirect("/login");
  }

  const { fifo } = await getFifoForUser(user.id);

  const [{ count: txCount }, subscription] = await Promise.all([
    supabaseAdmin
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
    getUserSubscription(user.id),
  ]);

  const isPro = subscription.plan === "pro" && subscription.isActive;

  const { data: lastTxRow } = await supabaseAdmin
    .from("transactions")
    .select("date")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .limit(1)
    .single();

  const realizedNet = Number((fifo.totalProfit + fifo.totalLoss).toFixed(2));
  const taxEstimate = realizedNet > 0 ? realizedNet * 0.25 : 0;
  const sellCount = fifo.sales.length;

  const openQuantities = Array.from(fifo.remainingLots.entries()).map(([asset, lots]) => ({
    asset,
    openQuantity: Number(lots.reduce((sum, lot) => sum + lot.amount, 0).toFixed(8)),
  }));
  const openPositionCount = openQuantities.filter((q) => q.openQuantity > 0).length;

  const lastDate = lastTxRow?.date
    ? new Date(lastTxRow.date).toLocaleDateString("sl-SI", { day: "2-digit", month: "2-digit", year: "numeric" })
    : "—";

  return (
    <main style={{ maxWidth: 960, margin: "40px auto", padding: 16 }}>
      <div style={{ marginBottom: 28, display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h1 style={{ marginBottom: 4 }}>Nadzorna plošča</h1>
          <p style={{ color: "#666" }}>Prijavljen kot: <strong>{user.email || user.id}</strong></p>
        </div>
        {isPro ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, backgroundColor: "#dcfce7", color: "#166534", border: "1px solid #86efac", borderRadius: 20, padding: "4px 12px", fontSize: 13, fontWeight: 600 }}>
            ✓ Pro plan
          </span>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ backgroundColor: "#fef3c7", color: "#92400e", border: "1px solid #fcd34d", borderRadius: 20, padding: "4px 12px", fontSize: 13, fontWeight: 500 }}>
              Brezplačni plan · {txCount ?? 0}/{FREE_TX_LIMIT} tx
            </div>
            <a href="/cenik" style={{ backgroundColor: "#2563eb", color: "white", borderRadius: 8, padding: "5px 12px", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
              Nadgradi
            </a>
          </div>
        )}
      </div>

      {/* KPI kartice */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 32 }}>
        <div style={{ padding: 20, backgroundColor: "#f0f9ff", borderRadius: 10, border: "1px solid #bae6fd" }}>
          <div style={{ fontSize: 12, color: "#555", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Uvožene transakcije</div>
          <div style={{ fontSize: 32, fontWeight: "bold", color: "#0369a1" }}>{txCount ?? 0}</div>
          <div style={{ fontSize: 11, color: "#888", marginTop: 6 }}>Zadnji uvoz: {lastDate}</div>
        </div>

        <div style={{ padding: 20, backgroundColor: realizedNet >= 0 ? "#f0fdf4" : "#fff1f2", borderRadius: 10, border: `1px solid ${realizedNet >= 0 ? "#86efac" : "#fca5a5"}` }}>
          <div style={{ fontSize: 12, color: "#555", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Neto realiziran P&amp;L</div>
          <div style={{ fontSize: 32, fontWeight: "bold", color: realizedNet >= 0 ? "#16a34a" : "#dc2626" }}>
            {realizedNet >= 0 ? "+" : ""}{realizedNet.toFixed(2)} €
          </div>
          <div style={{ fontSize: 11, color: "#888", marginTop: 6 }}>Dobiček minus izguba (FIFO)</div>
        </div>

        <div style={{ padding: 20, backgroundColor: "#fef9ec", borderRadius: 10, border: "1px solid #fde68a" }}>
          <div style={{ fontSize: 12, color: "#555", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Ocena davka (25%)</div>
          <div style={{ fontSize: 32, fontWeight: "bold", color: taxEstimate > 0 ? "#b45309" : "#888" }}>
            {taxEstimate > 0 ? taxEstimate.toFixed(2) + " €" : "—"}
          </div>
          <div style={{ fontSize: 11, color: "#888", marginTop: 6 }}>Dohodnina na kapitalski dobiček</div>
        </div>

        <div style={{ padding: 20, backgroundColor: "#f5f5f5", borderRadius: 10, border: "1px solid #ddd" }}>
          <div style={{ fontSize: 12, color: "#555", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Realizirane prodaje</div>
          <div style={{ fontSize: 32, fontWeight: "bold", color: "#333" }}>{sellCount}</div>
          <div style={{ fontSize: 11, color: "#888", marginTop: 6 }}>Skupaj FIFO-zaključenih prodaj</div>
        </div>

        <div style={{ padding: 20, backgroundColor: "#f5f0ff", borderRadius: 10, border: "1px solid #d8b4fe" }}>
          <div style={{ fontSize: 12, color: "#555", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Odprte pozicije</div>
          <div style={{ fontSize: 32, fontWeight: "bold", color: "#7c3aed" }}>{openPositionCount}</div>
          <div style={{ fontSize: 11, color: "#888", marginTop: 6 }}>Assetov z neodprodano količino</div>
        </div>
      </div>

      {/* Hitri dostop */}
      <div style={{ padding: 20, border: "1px solid #ddd", borderRadius: 10, marginBottom: 20 }}>
        <h3 style={{ marginTop: 0, marginBottom: 12 }}>Hitri dostop</h3>
        <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 2 }}>
          <li><a href="/upload">Uvozi transakcije</a> — naloži Trading212 CSV datoteko</li>
          <li><a href="/transactions">Pregled transakcij</a> — filtriraj in analiziraj</li>
          <li><a href="/reports">Poročila &amp; izvoz</a> — pripravi DOH-KDVP XML za eDavke</li>
        </ul>
      </div>

      {openPositionCount > 0 && (
        <div style={{ padding: 16, backgroundColor: "#fafaf9", borderRadius: 8, border: "1px solid #e5e7eb" }}>
          <h4 style={{ marginTop: 0, marginBottom: 10, color: "#555" }}>Odprte pozicije po assetu</h4>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {openQuantities
              .filter((q) => q.openQuantity > 0)
              .map((q) => (
                <span
                  key={q.asset}
                  style={{
                    padding: "4px 10px",
                    backgroundColor: "#ede9fe",
                    borderRadius: 20,
                    fontSize: 12,
                    color: "#5b21b6",
                    fontWeight: 500,
                  }}
                >
                  {q.asset}: {q.openQuantity.toFixed(6)}
                </span>
              ))}
          </div>
        </div>
      )}
    </main>
  );
}
