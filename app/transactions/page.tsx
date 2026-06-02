import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getFifoForUser } from "@/lib/fifo-server";
import { getSubscription } from "@/lib/subscription";
import TransactionEcbBadge from "@/components/transaction-ecb-badge";

export const metadata: Metadata = {
  title: "Transakcije | DavkiNaDelnicah.si",
};

const PAGE_SIZE = 50;
const FREE_LIMIT = 200;

interface Transaction {
  id: string;
  date: string;
  type: string;
  asset: string;
  amount: number;
  price_eur: number;
  fee_eur: number | null;
  exchange: string | null;
  broker?: string;
}

interface TransactionsPageProps {
  searchParams: Promise<{
    type?: string;
    asset?: string;
    broker?: string;
    year?: string;
    page?: string;
    debug?: string;
  }>;
}

function getTypeBadge(type: string): { cls: string; label: string } {
  switch (type) {
    case "buy":      return { cls: "tag-buy",      label: "Nakup" };
    case "sell":     return { cls: "tag-sell",     label: "Prodaja" };
    case "staking":  return { cls: "tag-staking",  label: "Dividende" };
    case "dividend": return { cls: "tag-div",      label: "Dividenda" };
    case "transfer": return { cls: "tag-transfer", label: "Transfer" };
    case "fee":      return { cls: "tag-fee",      label: "Provizija" };
    case "split":    return { cls: "tag-split",    label: "Split" };
    default:         return { cls: "tag-fee",      label: type };
  }
}

export default async function TransactionsPage({ searchParams }: TransactionsPageProps) {
  const params = await searchParams;
  const user = await requireUser();
  if (!user) redirect("/login");

  const typeFilter   = params.type   ?? "";
  const assetFilter  = params.asset  ?? "";
  const brokerFilter = params.broker ?? "";
  const yearFilter   = params.year   ?? "";
  const page         = Math.max(1, Number(params.page ?? "1"));

  const [{ fifo }, subscription] = await Promise.all([
    getFifoForUser(user.id, assetFilter || undefined),
    getSubscription(user.id),
  ]);

  const realizedNet = Number((fifo.totalProfit + fifo.totalLoss).toFixed(2));

  // Total unfiltered count (for gate threshold)
  const { count: unfiltered } = await supabaseAdmin
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);
  const globalCount = unfiltered ?? 0;
  const showGate = !subscription.isPro && globalCount > FREE_LIMIT;

  // Filtered count (for pagination)
  let countQuery = supabaseAdmin
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);
  if (typeFilter)   countQuery = countQuery.eq("type", typeFilter);
  if (assetFilter)  countQuery = countQuery.eq("asset", assetFilter);
  if (brokerFilter) countQuery = countQuery.eq("broker", brokerFilter);
  if (yearFilter) {
    countQuery = countQuery
      .gte("date", `${yearFilter}-01-01T00:00:00Z`)
      .lte("date", `${yearFilter}-12-31T23:59:59Z`);
  }
  const { count: totalCount } = await countQuery;
  const total = totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const offset = (safePage - 1) * PAGE_SIZE;

  // Gate clamps how many rows user can actually see
  const effectiveLimit = showGate ? FREE_LIMIT : Infinity;
  const gatedFromIndex = Math.max(0, effectiveLimit - offset);

  // Fetch page
  const selectColumns = "id,date,type,asset,amount,price_eur,fee_eur,exchange,broker";
  let query = supabaseAdmin
    .from("transactions")
    .select(selectColumns)
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);
  if (typeFilter)   query = query.eq("type", typeFilter);
  if (assetFilter)  query = query.eq("asset", assetFilter);
  if (brokerFilter) query = query.eq("broker", brokerFilter);
  if (yearFilter) {
    query = query
      .gte("date", `${yearFilter}-01-01T00:00:00Z`)
      .lte("date", `${yearFilter}-12-31T23:59:59Z`);
  }

  let result = await query;
  let data = result.data;
  let error = result.error;

  if (error?.message?.includes("transactions.broker")) {
    const fallback = await supabaseAdmin
      .from("transactions")
      .select("id,date,type,asset,amount,price_eur,fee_eur,exchange")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);
    data = (fallback.data as unknown) as typeof data;
    error = fallback.error;
  }
  if (error) throw new Error(error.message);

  const transactions = (data || []) as Transaction[];

  // Filter options
  const { data: allTx } = await supabaseAdmin
    .from("transactions")
    .select("asset,broker")
    .eq("user_id", user.id);
  const uniqueBrokers = Array.from(
    new Set((allTx || []).map((t) => t.broker).filter(Boolean) as string[])
  ).sort();

  const CRYPTO_BROKERS = new Set(["binance", "coinbase", "kraken", "bitstamp"]);
  const cryptoBrokersDetected = uniqueBrokers.filter((b) => CRYPTO_BROKERS.has(b.toLowerCase()));

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2021 }, (_, i) => currentYear - i);

  const pageParam = (p: number) => {
    const sp = new URLSearchParams({
      ...(typeFilter   && { type: typeFilter }),
      ...(assetFilter  && { asset: assetFilter }),
      ...(brokerFilter && { broker: brokerFilter }),
      ...(yearFilter   && { year: yearFilter }),
      page: String(p),
    });
    return `/transactions?${sp.toString()}`;
  };

  // Free users can't navigate past FREE_LIMIT regardless of total
  const canGoNext = safePage < totalPages && (!showGate || offset + PAGE_SIZE < FREE_LIMIT);

  return (
    <main>
      <section className="page-head">
        <div className="wrap">
          <div className="row between" style={{ flexWrap: "wrap", gap: 16, alignItems: "flex-end" }}>
            <div>
              <h1>Transakcije</h1>
              <p>Vse zaznane transakcije iz naloženih izpiskov. Razvrščeno padajoče po datumu.</p>
            </div>
            <div className="row gap-2">
              <a href="/upload" className="btn btn-line">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/></svg>
                Naloži dodatne
              </a>
              <a href="/reports" className="btn btn-primary">Generiraj poročilo <span className="arr">→</span></a>
            </div>
          </div>
        </div>
      </section>

      <section className="wrap" style={{ paddingBottom: 80 }}>
        {/* N3: ECB badge for crypto brokers */}
        {cryptoBrokersDetected.length > 0 && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            background: "var(--surface)", border: "1px solid var(--line)",
            borderRadius: "var(--r-md)", padding: "10px 16px",
            marginBottom: 20, fontSize: 13, color: "var(--muted)",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, color: "var(--accent)" }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            <span>
              <strong style={{ color: "var(--ink)" }}>Pretvorjeno po ECB</strong>
              {" "}— Transakcije iz {cryptoBrokersDetected.join(", ")} so pretvorjene v EUR po referenčnem tečaju ECB na datum transakcije.
            </span>
          </div>
        )}

        {/* FIFO summary stats */}
        <div className="admin-stats" style={{ marginBottom: 24 }}>
          <div className="admin-stat">
            <div className="k">Realiziran dobiček</div>
            <div className="v" style={{ color: "var(--pos)", fontSize: 28 }}>{fifo.totalProfit.toFixed(2)} €</div>
          </div>
          <div className="admin-stat">
            <div className="k">Realizirana izguba</div>
            <div className="v" style={{ color: "var(--neg)", fontSize: 28 }}>{Math.abs(fifo.totalLoss).toFixed(2)} €</div>
          </div>
          <div className="admin-stat">
            <div className="k">Neto realizirano</div>
            <div className="v" style={{ fontSize: 28, color: realizedNet >= 0 ? "var(--pos)" : "var(--neg)" }}>
              {realizedNet >= 0 ? "+" : ""}{realizedNet.toFixed(2)} €
            </div>
          </div>
          <div className="admin-stat">
            <div className="k">Skupaj transakcij</div>
            <div className="v" style={{ fontSize: 28 }}>{globalCount}<small> zapisov</small></div>
          </div>
        </div>

        {/* Filter bar */}
        <form method="get" className="filter-bar">
          <div className="search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
            <input type="text" name="asset" defaultValue={assetFilter} placeholder="Ticker (BTC, AAPL…)" />
          </div>
          <select className="select" name="type" defaultValue={typeFilter} style={{ width: "auto", minWidth: 130 }}>
            <option value="">Vsi tipi</option>
            <option value="buy">Nakup</option>
            <option value="sell">Prodaja</option>
            <option value="staking">Dividende</option>
            <option value="transfer">Transfer</option>
            <option value="fee">Provizija</option>
          </select>
          {uniqueBrokers.length > 0 && (
            <select className="select" name="broker" defaultValue={brokerFilter} style={{ width: "auto", minWidth: 130 }}>
              <option value="">Vsi brokerji</option>
              {uniqueBrokers.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          )}
          <select className="select" name="year" defaultValue={yearFilter} style={{ width: "auto", minWidth: 110 }}>
            <option value="">Vsa leta</option>
            {years.map((y) => <option key={y} value={String(y)}>{y}</option>)}
          </select>
          <input type="hidden" name="page" value="1" />
          <button type="submit" className="btn btn-primary btn-sm">Filtriraj</button>
          {(typeFilter || assetFilter || brokerFilter || yearFilter) && (
            <a href="/transactions" className="btn btn-line btn-sm">Počisti</a>
          )}
        </form>

        {transactions.length === 0 ? (
          <div className="empty">
            <h3>Ni transakcij</h3>
            <p>Naloži CSV izpisek, da začneš.</p>
            <a href="/upload" className="btn btn-primary">Naloži izpisek</a>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 10 }}>
              Prikaz{" "}
              <strong style={{ color: "var(--ink)" }}>{offset + 1}–{offset + transactions.length}</strong>
              {" "}od{" "}
              <strong style={{ color: "var(--ink)" }}>{total}</strong> transakcij
              {showGate && (
                <span style={{ marginLeft: 12, color: "var(--warn)", fontWeight: 600 }}>
                  · Brezplačni načrt: vidnih prvih {FREE_LIMIT}
                </span>
              )}
            </div>

            <div className="gate-wrapper">
              <div className="tbl-wrap" style={{ position: "relative" }}>
                <div className="tbl-scroll">
                  <table className="data">
                    <thead>
                      <tr>
                        <th>Datum</th>
                        <th>Ticker</th>
                        <th>Tip</th>
                        <th className="num">Količina</th>
                        <th className="num">Cena (EUR)</th>
                        <th className="num">Provizija</th>
                        <th>Borza / Broker</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx, idx) => {
                        const gated = showGate && idx >= gatedFromIndex;
                        const badge = getTypeBadge(tx.type);
                        return (
                          <tr
                            key={tx.id}
                            className={gated ? "tbl-blur-row" : undefined}
                            aria-hidden={gated || undefined}
                          >
                            <td>{new Date(tx.date).toLocaleDateString("sl-SI", { day: "2-digit", month: "short", year: "numeric" })}</td>
                            <td className="mono">{tx.asset}</td>
                            <td><span className={badge.cls}>{badge.label}</span></td>
                            <td className="num mono">{tx.amount.toFixed(4)}</td>
                            <td className="num mono">{tx.price_eur.toFixed(2)}</td>
                            <td className="num mono">{tx.fee_eur != null ? tx.fee_eur.toFixed(2) : "—"}</td>
                            <td>
                              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, position: "relative" }}>
                                {tx.broker || tx.exchange || "—"}
                                {tx.broker && CRYPTO_BROKERS.has(tx.broker.toLowerCase()) && (
                                  <TransactionEcbBadge
                                    date={tx.date}
                                    asset={tx.asset}
                                    priceEur={tx.price_eur}
                                    broker={tx.broker}
                                    isPro={subscription.isPro}
                                  />
                                )}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Gate overlay — shown when at least some rows on this page are gated */}
              {showGate && gatedFromIndex < transactions.length && (
                <div className="gate-overlay">
                  <div className="copy">
                    <div className="ic">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                    </div>
                    <div>
                      <h4>Odklenite vse transakcije z DavkiNaDelnicah Pro</h4>
                      <p>Brezplačni načrt prikazuje prvih {FREE_LIMIT} transakcij. Nadgradite za neomejen pregled in XML izvoz.</p>
                    </div>
                  </div>
                  <a href="/cenik" className="btn btn-primary" style={{ whiteSpace: "nowrap" }}>
                    Nadgradi na Pro <span className="arr">→</span>
                  </a>
                </div>
              )}

              {/* Whole page is gated */}
              {showGate && gatedFromIndex <= 0 && (
                <div className="gate-overlay" style={{ marginTop: 0 }}>
                  <div className="copy">
                    <div className="ic">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                    </div>
                    <div>
                      <h4>Ta stran je zaklenjena za Pro načrt</h4>
                      <p>Ogledujete si transakcije po prvih {FREE_LIMIT}. Nadgradite za dostop do vseh.</p>
                    </div>
                  </div>
                  <a href="/cenik" className="btn btn-primary" style={{ whiteSpace: "nowrap" }}>
                    Nadgradi na Pro <span className="arr">→</span>
                  </a>
                </div>
              )}
            </div>

            {/* Pagination */}
            <div className="pagination">
              <span>
                Stran <strong>{safePage}</strong> od <strong>{totalPages}</strong>
              </span>
              <div className="pages">
                {safePage > 1 ? (
                  <a href={pageParam(safePage - 1)} className="btn btn-line btn-sm">← Prej</a>
                ) : (
                  <button className="btn btn-line btn-sm" disabled>← Prej</button>
                )}
                {canGoNext ? (
                  <a href={pageParam(safePage + 1)} className="btn btn-line btn-sm">Naslednja →</a>
                ) : (
                  <button
                    className="btn btn-line btn-sm"
                    disabled
                    title={showGate ? "Nadgradi za dostop do več transakcij" : undefined}
                  >
                    Naslednja →
                  </button>
                )}
              </div>
              <a href="/reports" className="btn btn-ghost btn-sm">Generiraj XML →</a>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
