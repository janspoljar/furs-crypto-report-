// TODO: Prilagodi za FURS obrazce Doh_KDVP, D_IFI in Doh_Div.
import type { FifoResult, TaxableSale } from "./fifo";

export interface TaxpayerInfo {
  taxNumber: string;
  name: string;
  address: string;
  year: number;
}

function formatDate(d: Date): string { return d.toISOString().slice(0, 10); }
function fmt(n: number): string { return n.toFixed(8); }
function esc(s: string): string {
  return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

export function generateXml(result: FifoResult, taxpayer: TaxpayerInfo): string {
  const byAsset = new Map<string, TaxableSale[]>();
  for (const sale of result.sales) {
    if (!byAsset.has(sale.asset)) byAsset.set(sale.asset, []);
    byAsset.get(sale.asset)!.push(sale);
  }

  const L: string[] = [];
  L.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  L.push(`<Doh_KDVP_Data xmlns="http://edavki.durs.si/Documents/Schemas/Doh_KDVP_9.xsd">`);
  L.push(`  <taxpayer>`);
  L.push(`    <taxNumber>${esc(taxpayer.taxNumber)}</taxNumber>`);
  L.push(`    <name>${esc(taxpayer.name)}</name>`);
  L.push(`    <address>${esc(taxpayer.address)}</address>`);
  L.push(`    <year>${taxpayer.year}</year>`);
  L.push(`  </taxpayer>`);
  L.push(`  <Doh_KDVP>`);
  L.push(`    <DocumentWorkflowID>O</DocumentWorkflowID>`);
  L.push(`    <Year>${taxpayer.year}</Year>`);
  L.push(`    <PeriodStart>${taxpayer.year}-01-01</PeriodStart>`);
  L.push(`    <PeriodEnd>${taxpayer.year}-12-31</PeriodEnd>`);
  L.push(`    <IsResident>true</IsResident>`);
  L.push(`    <TaxRate>0.25</TaxRate>`);

  for (const [asset, sales] of byAsset) {
    L.push(`    <Securities>`);
    L.push(`      <Code>${esc(asset)}</Code>`);
    L.push(`      <Name>${esc(asset)}</Name>`);
    L.push(`      <IsFond>false</IsFond>`);

    let rowId = 1;
    let stock = 0;

    for (const sale of sales) {
      for (const acq of sale.acquisitions) {
        stock = parseFloat((stock + acq.amount).toFixed(8));
        L.push(`      <Row>`);
        L.push(`        <ID>${rowId++}</ID>`);
        L.push(`        <Purchase>`);
        L.push(`          <F1>${formatDate(acq.date)}</F1>`);
        L.push(`          <F2>A</F2>`);
        L.push(`          <F3>${fmt(acq.amount)}</F3>`);
        L.push(`          <F4>${fmt(acq.costPerUnit)}</F4>`);
        L.push(`        </Purchase>`);
        L.push(`        <F8>${fmt(stock)}</F8>`);
        L.push(`      </Row>`);
      }

      stock = parseFloat((stock - sale.amountSold).toFixed(8));
      if (Math.abs(stock) < 1e-9) stock = 0;

      L.push(`      <Row>`);
      L.push(`        <ID>${rowId++}</ID>`);
      L.push(`        <Sale>`);
      L.push(`          <F6>${formatDate(sale.date)}</F6>`);
      L.push(`          <F7>${fmt(sale.amountSold)}</F7>`);
      L.push(`          <F9>${fmt(sale.salePricePerUnit)}</F9>`);
      L.push(`        </Sale>`);
      L.push(`        <F8>${fmt(stock)}</F8>`);
      L.push(`      </Row>`);
    }

    L.push(`    </Securities>`);
  }

  L.push(`  </Doh_KDVP>`);
  L.push(`</Doh_KDVP_Data>`);
  return L.join("\n");
}
