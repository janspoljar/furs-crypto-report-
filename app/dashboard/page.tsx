import type { Metadata } from "next";
import { getUserFromServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getSubscription } from "@/lib/subscription";
import { getFifoForUser } from "@/lib/fifo-server";

export const metadata: Metadata = {
  title: "Nadzorna plošča | DavkiNaDelnicah.si",
};

export default async function DashboardPage() {
  const { user, error } = await getUserFromServer();
  if (error || !user) redirect("/login");

  const uid = user.id;

  // Parallel data fetching
  const [
    { count: txCountRaw },
    { data: brokerRows },
    { fifo },
    subscription,
  ] = await Promise.all([
    supabaseAdmin
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", uid),
    supabaseAdmin
      .from("transactions")
      .select("broker")
      .eq("user_id", uid),
    getFifoForUser(uid),
    getSubscription(uid),
  ]);

  const txCount = txCountRaw ?? 0;
  const isPro = subscription.isPro;

  // Distinct brokers
  const distinctBrokers = Array.from(
    new Set((brokerRows ?? []).map((r: { broker: string | null }) => r.broker).filter(Boolean))
  ) as string[];

  // Annual P&L from FIFO sales
  const yearMap = new Map<number, { profit: number; loss: number }>();
  for (const sale of fifo.sales) {
    const year = sale.date.getFullYear();
    if (!yearMap.has(year)) yearMap.set(year, { profit: 0, loss: 0 });
    const entry = yearMap.get(year)!;
    if (sale.profit > 0) entry.profit += sale.profit;
    else entry.loss += sale.profit;
  }
  const annualPnl = Array.from(yearMap.entries())
    .map(([year, { profit, loss }]) => ({
      year,
      profit: Number(profit.toFixed(2)),
      loss: Number(loss.toFixed(2)),
      net: Number((profit + loss).toFixed(2)),
    }))
    .sort((a, b) => b.year - a.year);

  // Top gainers / losers from fifo.summary
  const topGainers = [...fifo.summary]
    .filter((s) => s.profit > 0)
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 5);

  const topLosers = [...fifo.summary]
    .filter((s) => s.loss < 0)
    .sort((a, b) => a.loss - b.loss)
    .slice(0, 5);

  // Open positions
  const openPositions = Array.from(fifo.remainingLots.entries()).filter(
    ([, lots]) => lots.reduce((s, l) => s + l.amount, 0) > 0
  ).length;

  // All-time net P&L
  const netPnl = Number((fifo.totalProfit + fifo.totalLoss).toFixed(2));
  const taxEstimate = netPnl > 0 ? Number((netPnl * 0.25).toFixed(2)) : 0;

  // Max absolute value for bar chart scaling
  const maxAbsNet =
    annualPnl.length > 0
      ? Math.max(...annualPnl.map((r) => Math.abs(r.net)), 1)
      : 1;

  // Last year for free gate
  const lastYear = annualPnl.length > 0 ? annualPnl[0].year : null;

  const blurStyle: React.CSSProperties = {
    filter: "blur(4px)",
    userSelect: "none",
    pointerEvents: "none",
    opacity: 0.65,
  };

  return (
    <main>
      <section className="page-head">
        <div className="wrap">
          <h1>Nadzorna plošča</h1>
          <p>
            Pregled tvojih transakcij, realiziranega P&amp;L in davčnih obveznosti.
            {distinctBrokers.length > 0 && (
              <span style={{ color: "var(--muted)", marginLeft: 8 }}>
                Posredniki: {distinctBrokers.join(", ")}
              </span>
            )}
          </p>
        </div>
      </section>

      <section className="wrap" style={{ paddingBottom: 80 }}>
        {/* Stats row */}
        <div className="admin-stats" style={{ marginBottom: 32 }}>
          <div className="admin-stat">
            <div className="k">Skupaj transakcij</div>
            <div className="v">{txCount}</div>
            
          </div>

          <div className="admin-stat">
            <div className="k">Neto P&amp;L</div>
            <div
              className="v"
              style={{ color: netPnl >= 0 ? "var(--pos)" : "var(--neg)" }}
            >
              {netPnl >= 0 ? "+" : ""}
              {netPnl.toFixed(2)} €
            </div>
            
          </div>

          <div className="admin-stat">
            <div className="k">Ocenjeni davek (25&nbsp;%)</div>
            <div
              className="v"
              style={{ color: taxEstimate > 0 ? "var(--warn)" : "var(--muted)" }}
            >
              {taxEstimate > 0 ? `${taxEstimate.toFixed(2)} €` : "—"}
            </div>
            
          </div>

          <div className="admin-stat">
            <div className="k">Odprte pozicije</div>
            <div className="v">{openPositions}</div>
            
          </div>
        </div>

        {/* P&L po letih */}
        {annualPnl.length > 0 && (
          <div className="card" style={{ marginBottom: 28 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                P&amp;L po letih
              </h2>
              {isPro && (
                <span className="badge badge-pro" style={{ fontSize: 11 }}>
                  Pro
                </span>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {annualPnl.map((row) => {
                const isLocked = !isPro && row.year !== lastYear;
                const barPct = Math.max(
                  (Math.abs(row.net) / maxAbsNet) * 100,
                  1
                );

                return (
                  <div key={row.year}>
                    <div
                      style={isLocked ? blurStyle : undefined}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <span
                          style={{
                            width: 48,
                            fontFamily: "var(--font-mono)",
                            fontSize: 13,
                            color: "var(--ink-soft)",
                          }}
                        >
                          {row.year}
                        </span>
                        <div
                          style={{
                            flex: 1,
                            height: 28,
                            background: "var(--surface-2)",
                            borderRadius: 6,
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${barPct}%`,
                              height: "100%",
                              background:
                                row.net >= 0 ? "var(--pos)" : "var(--neg)",
                              borderRadius: 6,
                              minWidth: 4,
                            }}
                          />
                        </div>
                        <span
                          style={{
                            width: 100,
                            textAlign: "right",
                            fontFamily: "var(--font-mono)",
                            color: row.net >= 0 ? "var(--pos)" : "var(--neg)",
                            fontWeight: 600,
                            fontSize: 13,
                          }}
                        >
                          {row.net >= 0 ? "+" : ""}
                          {row.net.toFixed(2)} €
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {!isPro && annualPnl.length > 1 && (
              <div
                className="gate-strip-inline"
                style={{
                  marginTop: 16,
                  padding: "10px 14px",
                  background:
                    "color-mix(in srgb, var(--accent) 8%, var(--surface))",
                  border:
                    "1px solid color-mix(in srgb, var(--accent) 20%, transparent)",
                  borderRadius: "var(--r)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>
                  Podatki starejših let so na voljo v Pro načrtu.
                </span>
                <a
                  href="/cenik"
                  className="btn btn-primary"
                  style={{ fontSize: 13, padding: "6px 14px" }}
                >
                  Pro načrt →
                </a>
              </div>
            )}
          </div>
        )}

        {/* Top gainers & losers */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 20,
            marginBottom: 28,
          }}
        >
          {/* Top dobički */}
          <div className="card">
            <h2
              style={{
                margin: "0 0 16px",
                fontSize: 15,
                fontWeight: 700,
              }}
            >
              Top 5 Dobički
            </h2>
            {topGainers.length === 0 ? (
              <p style={{ color: "var(--muted)", fontSize: 13 }}>
                Ni realiziranih dobičkov.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {topGainers.map((item, idx) => {
                  const isLocked = !isPro && idx >= 3;
                  return (
                    <div
                      key={item.asset}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        ...(isLocked ? blurStyle : {}),
                      }}
                    >
                      <span
                        style={{
                          width: 20,
                          fontSize: 12,
                          color: "var(--muted)",
                          fontFamily: "var(--font-mono)",
                          textAlign: "right",
                        }}
                      >
                        {idx + 1}
                      </span>
                      <span
                        style={{
                          flex: 1,
                          fontFamily: "var(--font-mono)",
                          fontWeight: 600,
                          fontSize: 14,
                        }}
                      >
                        {item.asset}
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 13,
                          color: "var(--pos)",
                          fontWeight: 600,
                        }}
                      >
                        +{item.profit.toFixed(2)} €
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            {!isPro && topGainers.length > 3 && (
              <div
                className="gate-strip-inline"
                style={{
                  marginTop: 12,
                  padding: "8px 12px",
                  background:
                    "color-mix(in srgb, var(--accent) 8%, var(--surface))",
                  border:
                    "1px solid color-mix(in srgb, var(--accent) 20%, transparent)",
                  borderRadius: "var(--r)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                  Mesta 4–5 so zaklenjena.
                </span>
                <a
                  href="/cenik"
                  className="btn btn-primary"
                  style={{ fontSize: 12, padding: "4px 10px" }}
                >
                  Pro načrt →
                </a>
              </div>
            )}
          </div>

          {/* Top izgube */}
          <div className="card">
            <h2
              style={{
                margin: "0 0 16px",
                fontSize: 15,
                fontWeight: 700,
              }}
            >
              Top 5 Izgube
            </h2>
            {topLosers.length === 0 ? (
              <p style={{ color: "var(--muted)", fontSize: 13 }}>
                Ni realiziranih izgub.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {topLosers.map((item, idx) => {
                  const isLocked = !isPro && idx >= 3;
                  return (
                    <div
                      key={item.asset}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        ...(isLocked ? blurStyle : {}),
                      }}
                    >
                      <span
                        style={{
                          width: 20,
                          fontSize: 12,
                          color: "var(--muted)",
                          fontFamily: "var(--font-mono)",
                          textAlign: "right",
                        }}
                      >
                        {idx + 1}
                      </span>
                      <span
                        style={{
                          flex: 1,
                          fontFamily: "var(--font-mono)",
                          fontWeight: 600,
                          fontSize: 14,
                        }}
                      >
                        {item.asset}
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 13,
                          color: "var(--neg)",
                          fontWeight: 600,
                        }}
                      >
                        {item.loss.toFixed(2)} €
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            {!isPro && topLosers.length > 3 && (
              <div
                className="gate-strip-inline"
                style={{
                  marginTop: 12,
                  padding: "8px 12px",
                  background:
                    "color-mix(in srgb, var(--accent) 8%, var(--surface))",
                  border:
                    "1px solid color-mix(in srgb, var(--accent) 20%, transparent)",
                  borderRadius: "var(--r)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                  Mesta 4–5 so zaklenjena.
                </span>
                <a
                  href="/cenik"
                  className="btn btn-primary"
                  style={{ fontSize: 12, padding: "4px 10px" }}
                >
                  Pro načrt →
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Quick links */}
        <div className="card">
          <h2
            style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 700 }}
          >
            Hitri dostop
          </h2>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <a href="/upload" className="btn btn-primary">
              Uvozi novo →
            </a>
            <a href="/reports" className="btn btn-line">
              Generiraj XML
            </a>
            <a href="/transactions" className="btn btn-ghost">
              Transakcije
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
