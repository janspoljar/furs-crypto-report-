/**
 * DOH-DIV: agregacija dividend/staking transakcij in XML builder za FURS
 *
 * FURS obrazec DOH-DIV pokriva:
 * - Dividende iz tujih vrednostnih papirjev
 * - Obresti/staking nagrade iz kriptovalut
 *
 * Davčna stopnja: 25% dohodnine na bruto dividendo
 * Zmanjšanje: tuji odtegnjeni davek (Trading212 ga poroča v CSV kot
 *   negativno vrstico tipa "Dividend (Withholding tax)")
 */

export interface DohDivEntry {
  /** Ticker / asset simbol (npr. VWCE, AAPL) */
  asset: string;
  /** Ime plačnika — privzeto enako kot asset, uporabnik lahko popravi */
  payerName: string;
  /** ISIN — Trading212 ga ne vedno vključuje; prazno = uporabnik mora dopolniti */
  isin: string;
  /** Država vira dividende (ISO 3166-1 alpha-2), npr. "US", "IE" */
  countryCode: string;
  /** Skupna bruto dividenda v EUR za leto */
  dividendAmount: number;
  /** Že odtegnjeni tuji davek v EUR (pozitivna vrednost = odtegnjen) */
  withheldTax: number;
  /** Slovensko doplačilo: max(0, dividendAmount*0.25 - withheldTax) */
  slovenianTaxDue: number;
  /** Skupaj transakcij tega tipa za asset v letu */
  transactionCount: number;
  /** Datumi (za pregled) */
  dates: string[];
}

export interface DohDivSummary {
  year: number;
  entries: DohDivEntry[];
  totalDividends: number;
  totalWithheld: number;
  totalSlovenianDue: number;
  hasIncompleteISIN: boolean;
  hasIncompleteCountry: boolean;
  transactionCount: number;
}

export interface DivTransaction {
  id: string;
  date: string;
  type: string; // 'staking' | 'dividend'
  asset: string;
  amount: number;
  price_eur: number;
  fee_eur: number | null;
  exchange: string | null;
  broker: string | null;
  isin?: string | null;
  country_code?: string | null;
  payer_name?: string | null;
  withholding_tax_eur?: number | null;
}

/**
 * Pretvori surove transakcije v DOH-DIV povzetek za dano leto.
 * Agregira po assetu — vsak asset = en plačnik v obrazcu.
 */
export function buildDohDivSummary(transactions: DivTransaction[], year: number): DohDivSummary {
  // Filtriraj na staking/dividend tipa za dano leto
  const relevant = transactions.filter((tx) => {
    if (tx.type !== "staking") return false;
    const txYear = new Date(tx.date).getFullYear();
    return txYear === year;
  });

  // Agregacija po assetu
  const byAsset = new Map<string, {
    entries: DivTransaction[];
    withheld: number;
  }>();

  for (const tx of relevant) {
    const key = tx.asset;
    if (!byAsset.has(key)) {
      byAsset.set(key, { entries: [], withheld: 0 });
    }
    const group = byAsset.get(key)!;
    group.entries.push(tx);
  }

  const entries: DohDivEntry[] = [];

  for (const [asset, group] of byAsset.entries()) {
    const dividendTxs = group.entries;

    // Seštej bruto dividende (price_eur * amount za staking = vrednost nagrade)
    const dividendAmount = Number(
      dividendTxs
        .reduce((sum, tx) => sum + tx.price_eur * Math.abs(tx.amount), 0)
        .toFixed(2)
    );

    // Odtegnjeni tuji davek — iz withholding_tax_eur stolpca (če obstaja)
    const withheldTax = Number(
      dividendTxs
        .reduce((sum, tx) => sum + (tx.withholding_tax_eur ?? 0), 0)
        .toFixed(2)
    );

    // Slovensko doplačilo = max(0, 25% - že odtegnjeno)
    const grossTax = Number((dividendAmount * 0.25).toFixed(2));
    const slovenianTaxDue = Number(Math.max(0, grossTax - withheldTax).toFixed(2));

    // ISIN in država — vzami iz prve transakcije ki ju ima
    const isin = dividendTxs.find((tx) => tx.isin)?.isin ?? "";
    const countryCode = dividendTxs.find((tx) => tx.country_code)?.country_code ?? "";
    const payerName = dividendTxs.find((tx) => tx.payer_name)?.payer_name ?? asset;

    entries.push({
      asset,
      payerName,
      isin: isin || "",
      countryCode: countryCode || "",
      dividendAmount,
      withheldTax,
      slovenianTaxDue,
      transactionCount: dividendTxs.length,
      dates: dividendTxs.map((tx) => tx.date.slice(0, 10)).sort(),
    });
  }

  // Sortiraj po assetu
  entries.sort((a, b) => a.asset.localeCompare(b.asset));

  const totalDividends = Number(entries.reduce((s, e) => s + e.dividendAmount, 0).toFixed(2));
  const totalWithheld = Number(entries.reduce((s, e) => s + e.withheldTax, 0).toFixed(2));
  const totalSlovenianDue = Number(entries.reduce((s, e) => s + e.slovenianTaxDue, 0).toFixed(2));

  return {
    year,
    entries,
    totalDividends,
    totalWithheld,
    totalSlovenianDue,
    hasIncompleteISIN: entries.some((e) => !e.isin),
    hasIncompleteCountry: entries.some((e) => !e.countryCode),
    transactionCount: relevant.length,
  };
}

/**
 * Zgradi XML za FURS DOH-DIV obrazec.
 * Format po FURS specifikaciji (eDP envelope).
 */
export function buildDohDivXml(
  summary: DohDivSummary,
  taxpayer: { taxNumber?: string; fullName?: string; address?: string } | null
): string {
  const esc = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const taxNo = taxpayer?.taxNumber ?? "";
  const name = esc(taxpayer?.fullName ?? "");
  const now = new Date().toISOString().slice(0, 19);

  const rows = summary.entries
    .map(
      (e) => `    <Dividend>
      <PayerName>${esc(e.payerName)}</PayerName>
      <PayerAddress></PayerAddress>
      <PayerCountry>${esc(e.countryCode)}</PayerCountry>
      <PayerIdentificationNumber>${esc(e.isin)}</PayerIdentificationNumber>
      <Type>1</Type>
      <Value>${e.dividendAmount.toFixed(2)}</Value>
      <ForeignTax>${e.withheldTax.toFixed(2)}</ForeignTax>
      <SourceCountry>${esc(e.countryCode)}</SourceCountry>
      <ReliefStatement></ReliefStatement>
    </Dividend>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<Envelope xmlns="http://edavki.durs.si/Documents/Schemas/Doh_Div_3.xsd"
          xmlns:edp="http://edavki.durs.si/Documents/Schemas/EDP-Common-1.xsd"
          xsi:schemaLocation="http://edavki.durs.si/Documents/Schemas/Doh_Div_3.xsd"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <edp:Header>
    <edp:taxpayer>
      <edp:taxNumber>${esc(taxNo)}</edp:taxNumber>
      <edp:taxpayerType>FO</edp:taxpayerType>
      <edp:name>${name}</edp:name>
      <edp:address1>${esc(taxpayer?.address ?? "")}</edp:address1>
    </edp:taxpayer>
    <edp:Workflow>
      <edp:DocumentWorkflowID>O</edp:DocumentWorkflowID>
    </edp:Workflow>
  </edp:Header>
  <edp:AttachmentList />
  <edp:Signatures />
  <body>
    <edp:bodyContent />
    <Doh_Div>
      <Period>${summary.year}</Period>
      <EmailAddress></EmailAddress>
      <PhoneNumber></PhoneNumber>
      <ResidentCountry>SI</ResidentCountry>
      <IsResident>true</IsResident>
${rows}
    </Doh_Div>
  </body>
</Envelope>`;
}
