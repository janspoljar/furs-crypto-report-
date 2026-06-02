import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getFifoForUser } from "@/lib/fifo-server";

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

interface TransactionStats {
  total: number;
  buy: number;
  sell: number;
  transfer: number;
  staking: number;
  fee: number;
}

interface TransactionsPageProps {
  searchParams: Promise<{
    type?: string;
    asset?: string;
    broker?: string;
    from?: string;
    to?: string;
    debug?: string;
  }>;
}

function getTypeColor(type: string) {
  switch (type) {
    case "buy":
      return "#060";
    case "sell":
      return "#c00";
    case "transfer":
      return "#008";
    case "staking":
      return "#880";
    case "fee":
      return "#666";
    default:
      return "#333";
  }
}

function getTypeLabel(type: string) {
  const labels: Record<string, string> = {
    buy: "Nakup",
    sell: "Prodaja",
    transfer: "Transfer",
    staking: "Dividend/Interest",
    fee: "Provizija",
  };
  return labels[type] || type;
}

export default async function TransactionsPage({ searchParams }: TransactionsPageProps) {
  const params = await searchParams;
  const user = await requireUser();
  if (!user) {
    redirect("/login");
  }

  const typeFilter = params.type ?? "";
  const assetFilter = params.asset ?? "";
  const brokerFilter = params.broker ?? "";
  const dateFromFilter = params.from ?? "";
  const dateToFilter = params.to ?? "";
  const debugMode = params.debug === "1";

  const { fifo } = await getFifoForUser(user.id, assetFilter || undefined);
  const openQuantities = Array.from(fifo.remainingLots.entries()).map(([asset, lots]) => ({
    asset,
    openQuantity: Number(lots.reduce((sum, lot) => sum + lot.amount, 0).toFixed(8)),
  }));
  const totalOpenQuantity = openQuantities.reduce((sum, item) => sum + item.openQuantity, 0);
  const realizedNet = Number((fifo.totalProfit + fifo.totalLoss).toFixed(2));

  const selectColumns = "id,date,type,asset,amount,price_eur,fee_eur,exchange,broker";
  let query = supabaseAdmin
    .from("transactions")
    .select(selectColumns)
    .eq("user_id", user.id)
    .order("date", { ascending: false });

  const applyFilters = (q: any, includeBroker: boolean) => {
    if (typeFilter) {
      q = q.eq("type", typeFilter);
    }
    if (assetFilter) {
      q = q.eq("asset", assetFilter);
    }
    if (includeBroker && brokerFilter) {
      q = q.eq("broker", brokerFilter);
    }
    if (dateFromFilter) {
      q = q.gte("date", `${dateFromFilter}T00:00:00Z`);
    }
    if (dateToFilter) {
      q = q.lte("date", `${dateToFilter}T23:59:59.999Z`);
    }
    return q;
  };

  query = applyFilters(query, true);
  let result = await query;
  let data = result.data;
  let error = result.error;

  if (error && error.message?.includes("transactions.broker")) {
    const fallbackQuery = supabaseAdmin
      .from("transactions")
      .select("id,date,type,asset,amount,price_eur,fee_eur,exchange")
      .eq("user_id", user.id)
      .order("date", { ascending: false });

    result = await applyFilters(fallbackQuery, false);
    const fallback = await result;
    data = fallback.data;
    error = fallback.error;
  }

  if (error) {
    throw new Error(error.message);
  }

  const transactions = (data || []) as Transaction[];
  const stats: TransactionStats = {
    total: transactions.length,
    buy: transactions.filter((t) => t.type === "buy").length,
    sell: transactions.filter((t) => t.type === "sell").length,
    transfer: transactions.filter((t) => t.type === "transfer").length,
    staking: transactions.filter((t) => t.type === "staking").length,
    fee: transactions.filter((t) => t.type === "fee").length,
  };

  const uniqueAssets = Array.from(new Set(transactions.map((t) => t.asset))).sort();
  const uniqueBrokers = Array.from(new Set(transactions.map((t) => t.broker).filter(Boolean) as string[])).sort();

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
            <div className="v" style={{ fontSize: 28 }}>{stats.total}<small> zapisov</small></div>
          </div>
        </div>

        {/* Filter bar */}
        <form method="get" className="filter-bar">
          <div className="search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
            <input type="text" name="asset" defaultValue={assetFilter} placeholder="Išči po tickerju (npr. BTC, ETH)…" />
          </div>
          <select className="select" name="type" defaultValue={typeFilter} style={{ width: "auto", minWidth: 140 }}>
            <option value="">Vsi tipi</option>
            <option value="buy">Nakup</option>
            <option value="sell">Prodaja</option>
            <option value="staking">Dividende</option>
            <option value="transfer">Transfer</option>
          </select>
          {uniqueBrokers.length > 0 && (
            <select className="select" name="broker" defaultValue={brokerFilter} style={{ width: "auto", minWidth: 140 }}>
              <option value="">Vsi brokerji</option>
              {uniqueBrokers.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          )}
          <button type="submit" className="btn btn-primary btn-sm">Filtriraj</button>
          {(typeFilter || assetFilter || brokerFilter) && (
            <a href="/transactions" className="btn btn-line btn-sm">Počisti</a>
          )}
        </form>

        {/* Table */}
        {transactions.length === 0 ? (
          <div className="empty">
            <h3>Ni transakcij</h3>
            <p>Naloži CSV izpisek, da začneš.</p>
            <a href="/upload" className="btn btn-primary">Naloži izpisek</a>
          </div>
        ) : (
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
                  {transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td>{new Date(tx.date).toLocaleDateString("sl-SI", { day: "2-digit", month: "short", year: "numeric" })}</td>
                      <td className="mono">{tx.asset}</td>
                      <td>
                        <span className={tx.type === "buy" ? "tag-buy" : tx.type === "staking" ? "tag-div" : "tag-sell"}>
                          {getTypeLabel(tx.type)}
                        </span>
                      </td>
                      <td className="num mono">{tx.amount.toFixed(4)}</td>
                      <td className="num mono">{tx.price_eur.toFixed(2)}</td>
                      <td className="num mono">{tx.fee_eur != null ? tx.fee_eur.toFixed(2) : "—"}</td>
                      <td>{tx.broker || tx.exchange || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="row between" style={{ marginTop: 18, fontSize: 13, color: "var(--muted)" }}>
          <span>Prikazano <strong style={{ color: "var(--ink)" }}>{transactions.length}</strong> transakcij</span>
          <a href="/reports" className="btn btn-line btn-sm">Generiraj XML poročilo →</a>
        </div>
      </section>
    </main>
  );
}