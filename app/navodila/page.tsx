import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Navodila za izvoz CSV | DavkiNaDelnicah.si",
  description:
    "Korak-po-korak navodila za izvoz transakcijskega izpiska iz Trading 212, Revolut, Interactive Brokers, eToro, Binance in Coinbase.",
};

interface BrokerGuide {
  id: string;
  name: string;
  bg: string;
  fg: string;
  letter: string;
  format: string;
  steps: string[];
  gotchas: string[];
}

const BROKERS: BrokerGuide[] = [
  {
    id: "trading212",
    name: "Trading 212",
    bg: "#000",
    fg: "#fff",
    letter: "T",
    format: "CSV — Activities",
    steps: [
      "Odprite aplikacijo Trading 212 ali spletno stran.",
      'Pojdite na <strong>History</strong> (Zgodovina) v levem meniju.',
      'Kliknite ikono <strong>Export</strong> (puščica navzdol) zgoraj desno.',
      'Izberite obdobje: <strong>"All time"</strong> za celotno zgodovino ali specifično leto.',
      'Pod "Export type" izberite <strong>Activities CSV</strong>.',
      'Kliknite <strong>Export</strong> in počakajte na e-pošto z linkom za prenos.',
      "Prenesite datoteko — imenuje se npr. <code>activities_2024.csv</code>.",
    ],
    gotchas: [
      "Dividende so <strong>ločen izvoz</strong> — izberite 'Dividends' in uvozite posebej.",
      '"Currency conversion" transakcije niso nakupi/prodaje — naša aplikacija jih samodejno preskoči.',
      "Če imate PIE naložbe, so te zajete v Activities, ne posebej.",
    ],
  },
  {
    id: "revolut",
    name: "Revolut",
    bg: "#0075EB",
    fg: "#fff",
    letter: "R",
    format: "CSV — Account Statement",
    steps: [
      "Odprite aplikacijo Revolut.",
      'Pojdite na <strong>Profile</strong> (ikona profila spodaj desno) → <strong>Documents</strong>.',
      'Izberite <strong>Account Statement</strong>.',
      'Izberite <strong>Custom period</strong> in vnesite datumski razpon (npr. 1. jan. 2024 – 31. dec. 2024).',
      'Pod "File format" izberite <strong>CSV</strong> (ne Excel/PDF).',
      'Izberite <strong>Stocks</strong> račun.',
      "Kliknite <strong>Generate Statement</strong> — datoteka se prenese takoj.",
    ],
    gotchas: [
      "Revolut <strong>ločuje Stocks in Crypto</strong> račune — uvozite oba, če imate oboje.",
      'Transakcije s "Cashback" ali "Card" niso borzne — samodejno se preskočijo.',
      "Fee transakcije imajo negativen znesek — to je pričakovano.",
      "Revolut ne prikaže ISIN v izpisku — to ni problem za izračun, bo pa opozorilo pri XML izvozu.",
    ],
  },
  {
    id: "ibkr",
    name: "Interactive Brokers",
    bg: "#D81222",
    fg: "#fff",
    letter: "I",
    format: "CSV — Activity Statement",
    steps: [
      'Prijavite se na <a href="https://www.interactivebrokers.com" target="_blank" rel="noopener noreferrer">Client Portal</a> ali TWS.',
      'Pojdite na <strong>Reports</strong> → <strong>Statements</strong> → <strong>Activity</strong>.',
      'Pod "Format" izberite <strong>CSV</strong>.',
      'Pod "Period" izberite <strong>Annual</strong> ali <strong>Custom Date Range</strong>.',
      'Preverite, da je sekcija <strong>Trades</strong> vključena (dividende so samodejno zajete).',
      'Kliknite <strong>Run</strong> in nato <strong>Download</strong>.',
    ],
    gotchas: [
      "IBKR ima več <strong>Account Types</strong> (Individual, IRA, itd.) — preverite, da ste na pravilnem.",
      "Flex Query je naprednejši izvoz — ni potreben, standardni Activity Statement zadošča.",
      "Forwardna poravnava (T+2) ne vpliva na izračun — datum transakcije je trade date.",
      "Corporate actions (dividende v obliki delnic, spin-off) so posebne vrstice — aplikacija jih bo označila kot 'neznane'.",
    ],
  },
  {
    id: "etoro",
    name: "eToro",
    bg: "#FF5C46",
    fg: "#fff",
    letter: "e",
    format: "XLSX → CSV pretvorba",
    steps: [
      'Prijavite se na <a href="https://www.etoro.com" target="_blank" rel="noopener noreferrer">eToro</a>.',
      'Pojdite na <strong>Portfolio</strong> → <strong>History</strong> → ikona za prenos.',
      'Izberite obdobje in kliknite <strong>Download Excel</strong>.',
      'Odprite preneseno <code>.xlsx</code> datoteko v programu Excel ali Google Sheets.',
      'V Excelu: <strong>File → Save As → CSV (Comma delimited) (.csv)</strong>.',
      'V Google Sheets: <strong>File → Download → CSV</strong>.',
      "Uvozite pretvorjeno <code>.csv</code> datoteko.",
    ],
    gotchas: [
      "eToro ne prikaže <strong>cost basis</strong> v izpisku — naša aplikacija jo izračuna iz zgodovine.",
      'eToro prikaže "CFD" pozicije — te niso delnice in se samodejno preskočijo.',
      "Datumi so pogosto v formatu MM/DD/YYYY — aplikacija to samodejno prepozna.",
      'eToro ne prikaže ISIN — bo opozorilo pri XML izvozu, a izračun bo pravilen.',
    ],
  },
  {
    id: "binance",
    name: "Binance",
    bg: "#F2A900",
    fg: "#000",
    letter: "B",
    format: "CSV — Transaction History",
    steps: [
      'Prijavite se na <a href="https://www.binance.com" target="_blank" rel="noopener noreferrer">Binance</a>.',
      'Pojdite na <strong>Wallet</strong> → <strong>Transaction History</strong>.',
      'Kliknite <strong>Generate All Statements</strong>.',
      'Izberite obdobje (max 3 mesece naenkrat — ponovite za vsako četrtletje).',
      'Ko je poročilo pripravljeno, prejmete e-pošto — kliknite link za prenos.',
      "Uvozite vsako CSV datoteko posebej ali jo kombinirajte v eno.",
    ],
    gotchas: [
      "Binance <strong>ločuje Spot, Futures, Earn</strong> — za davčni izračun uvozite samo <strong>Spot</strong>.",
      "Kriptovalutne menjave (BTC → ETH) so 'swap' transakcije — te imajo poseben davčni tretma.",
      "Staking nagrade so 'staking' tip — vključene v Doh-Div, ne Doh-KDVP.",
    ],
  },
  {
    id: "coinbase",
    name: "Coinbase",
    bg: "#0052FF",
    fg: "#fff",
    letter: "C",
    format: "CSV — Transaction History",
    steps: [
      'Prijavite se na <a href="https://www.coinbase.com" target="_blank" rel="noopener noreferrer">Coinbase</a>.',
      'Pojdite na <strong>Assets</strong> → <strong>Your Assets</strong>.',
      'Kliknite <strong>Download</strong> → <strong>Transaction History</strong>.',
      'Izberite format <strong>CSV</strong>.',
      "Prenesite datoteko — obsega vso zgodovino brez možnosti filtriranja po letu.",
    ],
    gotchas: [
      "Coinbase vključuje <strong>vse tipe</strong>: nakupi, prodaje, konverzije, coinbase earn — aplikacija samodejno razvrsti.",
      'Konverzije (npr. USDC → BTC) so "swap" tip in imajo poseben davčni tretma.',
      "Coinbase Advanced Trade ima ločen izvoz od Coinbase — preverite katerega uporabljate.",
    ],
  },
];

export default function NavodilaPage() {
  return (
    <main>
      <section className="page-head">
        <div className="wrap">
          <span className="eyebrow">Brezplačno · Brez prijave</span>
          <h1>Navodila za izvoz CSV</h1>
          <p>Izberite vašega posrednika in sledite korakom za izvoz transakcijskega izpiska.</p>
        </div>
      </section>

      <section className="wrap" style={{ paddingBottom: 80, maxWidth: 820 }}>
        {/* Quick jump */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 32 }}>
          {BROKERS.map((b) => (
            <a
              key={b.id}
              href={`#${b.id}`}
              className="chip"
              style={{ display: "inline-flex", alignItems: "center", gap: 7, textDecoration: "none" }}
            >
              <span style={{
                width: 20, height: 20, borderRadius: 5,
                background: b.bg, color: b.fg,
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 700, flexShrink: 0,
              }}>
                {b.letter}
              </span>
              {b.name}
            </a>
          ))}
        </div>

        {/* Broker sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {BROKERS.map((b) => (
            <div
              key={b.id}
              id={b.id}
              className="faq-item"
              style={{ scrollMarginTop: 80 }}
            >
              <button className="faq-q" style={{ padding: "18px 20px" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: b.bg, color: b.fg,
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14, fontWeight: 700,
                  }}>
                    {b.letter}
                  </span>
                  <span>
                    <strong style={{ fontSize: 16 }}>{b.name}</strong>
                    <span style={{ fontSize: 13, color: "var(--muted)", marginLeft: 10, fontFamily: "var(--font-mono)" }}>
                      {b.format}
                    </span>
                  </span>
                </span>
                <span className="pm">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </span>
              </button>

              <div className="faq-a">
                <div className="inner" style={{ padding: "4px 20px 20px" }}>
                  {/* Steps */}
                  <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 10 }}>
                    Koraki
                  </p>
                  <ol style={{ margin: "0 0 20px", paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                    {b.steps.map((step, i) => (
                      <li key={i} style={{ fontSize: 14.5, color: "var(--ink-soft)", lineHeight: 1.6 }}
                        dangerouslySetInnerHTML={{ __html: step }}
                      />
                    ))}
                  </ol>

                  {/* Gotchas */}
                  <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--warn)", marginBottom: 8 }}>
                    Pogoste napake
                  </p>
                  <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 6 }}>
                    {b.gotchas.map((g, i) => (
                      <li key={i} style={{ fontSize: 13.5, color: "var(--ink-soft)", lineHeight: 1.6 }}
                        dangerouslySetInnerHTML={{ __html: g }}
                      />
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Missing broker CTA */}
        <div className="card" style={{ marginTop: 40, textAlign: "center", padding: "32px 24px" }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 22, marginBottom: 8 }}>
            Vaš posrednik ni na seznamu?
          </h3>
          <p style={{ color: "var(--muted)", marginBottom: 20 }}>
            Pošljite nam vzorčni CSV in ga dodamo v dneh.
          </p>
          <a href="mailto:podpora@davkinadelnicah.si" className="btn btn-primary">
            Pošlji vzorec CSV <span className="arr">→</span>
          </a>
        </div>
      </section>
    </main>
  );
}
