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
    <main style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
      <h1>Transakcije</h1>
      <p style={{ color: "#666", marginTop: 8 }}>
        Pregled tvojih transakcij. Filtriraj po tipu, assetu, brokerju ali datumu.
      </p>
      <div style={{ padding: 16, backgroundColor: "#fff7e6", borderRadius: 8, marginTop: 16, border: "1px solid #f2d6a0" }}>
        <strong>FIFO status:</strong> trenutno podprto samo buy/sell v EUR. Druge tipe (transfer, dividend, interest, withdrawal, deposit, fee) ignoriramo. Feeji se sedaj vključijo v buy cost basis in sell proceeds.
      </div>
      <section style={{ padding: 16, backgroundColor: "#f4faff", borderRadius: 8, border: "1px solid #cfe7ff", marginTop: 24 }}>
        <h2 style={{ marginTop: 0 }}>FIFO summary</h2>
        <p style={{ margin: "0 0 12px", color: "#555" }}>
          V tej FIFO logiki so podprti samo buy/sell transakcije. Fees so vključeni, druge vrste (dividend, interest, transfer) še niso podprte.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
          <div style={{ padding: 16, backgroundColor: "#fff", borderRadius: 8, border: "1px solid #dde7f0" }}>
            <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>Realiziran dobiček</div>
            <div style={{ fontSize: 24, fontWeight: "bold", color: "#060" }}>{fifo.totalProfit.toFixed(2)} €</div>
          </div>
          <div style={{ padding: 16, backgroundColor: "#fff", borderRadius: 8, border: "1px solid #fde3e3" }}>
            <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>Realizirana izguba</div>
            <div style={{ fontSize: 24, fontWeight: "bold", color: "#c00" }}>{Math.abs(fifo.totalLoss).toFixed(2)} €</div>
          </div>
          <div style={{ padding: 16, backgroundColor: "#fff", borderRadius: 8, border: "1px solid #dde7f0" }}>
            <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>Neto realizirano</div>
            <div style={{ fontSize: 24, fontWeight: "bold", color: "#333" }}>{realizedNet.toFixed(2)} €</div>
          </div>
          <div style={{ padding: 16, backgroundColor: "#fff", borderRadius: 8, border: "1px solid #dde7f0" }}>
            <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>Odprta količina</div>
            <div style={{ fontSize: 24, fontWeight: "bold", color: "#333" }}>{totalOpenQuantity.toFixed(4)}</div>
          </div>
        </div>
      </section>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginTop: 24, marginBottom: 32 }}>
        <div style={{ padding: 16, backgroundColor: "#f0f0f0", borderRadius: 8 }}>
          <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>Realiziran dobiček</div>
          <div style={{ fontSize: 28, fontWeight: "bold", color: "#060" }}>{fifo.totalProfit.toFixed(2)} €</div>
        </div>
        <div style={{ padding: 16, backgroundColor: "#fee", borderRadius: 8 }}>
          <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>Realizirana izguba</div>
          <div style={{ fontSize: 28, fontWeight: "bold", color: "#c00" }}>{Math.abs(fifo.totalLoss).toFixed(2)} €</div>
        </div>
        <div style={{ padding: 16, backgroundColor: "#eef", borderRadius: 8 }}>
          <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>Neto realizirano</div>
          <div style={{ fontSize: 28, fontWeight: "bold", color: "#333" }}>{realizedNet.toFixed(2)} €</div>
        </div>
        <div style={{ padding: 16, backgroundColor: "#f5f5f5", borderRadius: 8 }}>
          <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>Odprta količina</div>
          <div style={{ fontSize: 28, fontWeight: "bold", color: "#333" }}>{totalOpenQuantity.toFixed(4)}</div>
        </div>
      </div>
      {openQuantities.length > 0 && (
        <div style={{ marginBottom: 24, padding: 16, backgroundColor: "#f9f9f9", borderRadius: 8, border: "1px solid #ddd" }}>
          <h3 style={{ marginTop: 0 }}>Open quantity po assetu</h3>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {openQuantities.map((item) => (
              <li key={item.asset}>
                <strong>{item.asset}</strong>: {item.openQuantity.toFixed(8)}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginTop: 24, marginBottom: 32 }}>
        <div style={{ padding: 16, backgroundColor: "#f0f0f0", borderRadius: 8 }}>
          <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>Skupaj</div>
          <div style={{ fontSize: 28, fontWeight: "bold", color: "#333" }}>{stats.total}</div>
        </div>
        <div style={{ padding: 16, backgroundColor: "#efe", borderRadius: 8 }}>
          <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>Nakupi</div>
          <div style={{ fontSize: 28, fontWeight: "bold", color: "#060" }}>{stats.buy}</div>
        </div>
        <div style={{ padding: 16, backgroundColor: "#fee", borderRadius: 8 }}>
          <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>Prodaje</div>
          <div style={{ fontSize: 28, fontWeight: "bold", color: "#c00" }}>{stats.sell}</div>
        </div>
        <div style={{ padding: 16, backgroundColor: "#eef", borderRadius: 8 }}>
          <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>Transferji</div>
          <div style={{ fontSize: 28, fontWeight: "bold", color: "#008" }}>{stats.transfer}</div>
        </div>
        <div style={{ padding: 16, backgroundColor: "#ffe", borderRadius: 8 }}>
          <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>Dividende</div>
          <div style={{ fontSize: 28, fontWeight: "bold", color: "#880" }}>{stats.staking}</div>
        </div>
      </div>

      <form method="get" style={{ padding: 16, backgroundColor: "#f5f5f5", borderRadius: 8, marginBottom: 24 }}>
        <h3 style={{ marginTop: 0 }}>Filtri</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 4 }}>Tip</label>
            <select name="type" defaultValue={typeFilter} style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}>
              <option value="">Vse</option>
              <option value="buy">Nakup</option>
              <option value="sell">Prodaja</option>
              <option value="transfer">Transfer</option>
              <option value="staking">Dividend/Interest</option>
              <option value="fee">Provizija</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 4 }}>Asset</label>
            <select name="asset" defaultValue={assetFilter} style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}>
              <option value="">Vse</option>
              {uniqueAssets.map((asset) => (
                <option key={asset} value={asset}>
                  {asset}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 4 }}>Broker</label>
            <select name="broker" defaultValue={brokerFilter} style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}>
              <option value="">Vse</option>
              {uniqueBrokers.map((broker) => (
                <option key={broker} value={broker}>
                  {broker}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 4 }}>Od datuma</label>
            <input name="from" type="date" defaultValue={dateFromFilter} style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 4 }}>Do datuma</label>
            <input name="to" type="date" defaultValue={dateToFilter} style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 4 }}>&nbsp;</label>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="submit" style={{ flex: 1, padding: 10, borderRadius: 4, backgroundColor: "#0066cc", color: "white", border: "none" }}>
                Uporabi filtre
              </button>
              <a href="/transactions" style={{ flex: 1, padding: 10, borderRadius: 4, backgroundColor: "#fff", color: "#333", border: "1px solid #ccc", textAlign: "center", textDecoration: "none" }}>
                Počisti
              </a>
            </div>
          </div>
        </div>
      </form>

      <div style={{ marginBottom: 12, color: "#666" }}>
        Prikazujem {transactions.length} transakcij po uporabi filtrov.
      </div>

      {debugMode && (
        <div style={{ marginBottom: 24, padding: 16, backgroundColor: "#f3f7ff", borderRadius: 8, border: "1px solid #c8d7ff" }}>
          <h3 style={{ marginTop: 0 }}>FIFO JSON debug</h3>
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: 12, color: "#333" }}>
            {JSON.stringify(fifo, null, 2)}
          </pre>
        </div>
      )}

      {transactions.length === 0 ? (
        <div style={{ padding: 24, backgroundColor: "#f5f5f5", borderRadius: 8, textAlign: "center", color: "#666" }}>
          Ni najdenih transakcij.
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ backgroundColor: "#f5f5f5", borderBottom: "2px solid #ddd" }}>
                <th style={{ padding: 12, textAlign: "left", fontWeight: 600 }}>Datum</th>
                <th style={{ padding: 12, textAlign: "left", fontWeight: 600 }}>Tip</th>
                <th style={{ padding: 12, textAlign: "left", fontWeight: 600 }}>Asset</th>
                <th style={{ padding: 12, textAlign: "right", fontWeight: 600 }}>Količina</th>
                <th style={{ padding: 12, textAlign: "right", fontWeight: 600 }}>Cena (EUR)</th>
                <th style={{ padding: 12, textAlign: "right", fontWeight: 600 }}>Provizija (EUR)</th>
                <th style={{ padding: 12, textAlign: "left", fontWeight: 600 }}>Borza</th>
                <th style={{ padding: 12, textAlign: "left", fontWeight: 600 }}>Broker</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: 12 }}>{new Date(tx.date).toLocaleDateString("sl-SI")}</td>
                  <td style={{ padding: 12 }}>
                    <span style={{ display: "inline-block", padding: "4px 8px", borderRadius: 4, backgroundColor: `${getTypeColor(tx.type)}22`, color: getTypeColor(tx.type), fontWeight: 500, fontSize: 12 }}>
                      {getTypeLabel(tx.type)}
                    </span>
                  </td>
                  <td style={{ padding: 12 }}>{tx.asset}</td>
                  <td style={{ padding: 12, textAlign: "right" }}>{tx.amount.toFixed(4)}</td>
                  <td style={{ padding: 12, textAlign: "right" }}>{tx.price_eur.toFixed(2)}</td>
                  <td style={{ padding: 12, textAlign: "right" }}>{tx.fee_eur !== null ? tx.fee_eur.toFixed(2) : "-"}</td>
                  <td style={{ padding: 12 }}>{tx.exchange || "-"}</td>
                  <td style={{ padding: 12 }}><span style={{ fontSize: 12, color: "#666" }}>{tx.broker}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}