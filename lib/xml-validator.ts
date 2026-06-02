// Semantic validator for generated Doh-KDVP XML strings.
// Complements the XSD schema validation (doh-kdvp.ts) with content-level checks.

export interface XmlValidationResult {
  valid: boolean;
  errors: string[];    // blocking — download disabled
  warnings: string[]; // non-blocking — download allowed with warning
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DECIMAL_RE = /^\d+(\.\d{1,8})?$/;

function text(xml: string, tag: string): string | null {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, "s"));
  return m ? m[1].trim() : null;
}

function allText(xml: string, tag: string): string[] {
  const re = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, "gs");
  const results: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) results.push(m[1].trim());
  return results;
}

function blocks(xml: string, tag: string): string[] {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "g");
  const results: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) results.push(m[1]);
  return results;
}

function checkDate(val: string | null, label: string, errors: string[], warnings: string[]) {
  if (!val) { errors.push(`Manjka obvezno polje: ${label}`); return; }
  if (!DATE_RE.test(val)) {
    errors.push(`Napačen format datuma pri ${label}: "${val}". Pričakovano YYYY-MM-DD.`);
    return;
  }
  const d = new Date(val);
  if (isNaN(d.getTime())) {
    errors.push(`Neveljaven datum pri ${label}: "${val}".`);
    return;
  }
  const now = new Date();
  if (d > now) warnings.push(`Datum pri ${label} je v prihodnosti: "${val}".`);
}

function checkPositiveDecimal(val: string | null, label: string, allowZero: boolean, errors: string[]) {
  if (val === null || val === "") { errors.push(`Manjka vrednost za ${label}.`); return; }
  const n = parseFloat(val);
  if (isNaN(n)) { errors.push(`Neveljavna številka pri ${label}: "${val}".`); return; }
  if (!allowZero && n <= 0) errors.push(`${label} mora biti večji od 0 (dobljeno: ${val}).`);
  if (n < 0) errors.push(`${label} ne sme biti negativen (dobljeno: ${val}).`);
  // FURS: max 8 decimal places on cost/proceeds fields
  const parts = val.split(".");
  if (parts[1] && parts[1].length > 8) {
    errors.push(`${label} ima preveč decimalnih mest (max 8, dobljeno: ${parts[1].length}).`);
  }
}

export function validateDohKdvp(xml: string): XmlValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!xml || xml.trim().length === 0) {
    return { valid: false, errors: ["XML je prazen."], warnings: [] };
  }

  // ── Envelope & root ──────────────────────────────────────────────
  if (!xml.includes("Doh_KDVP")) {
    errors.push("XML ne vsebuje korenskega elementa Doh_KDVP. Možno napačno poročilo.");
  }

  // ── Taxpayer fields ───────────────────────────────────────────────
  const taxNumber = text(xml, "TaxNumber");
  if (!taxNumber) {
    errors.push("Manjka davčna številka zavezanca (TaxNumber).");
  } else if (!/^\d{8}$/.test(taxNumber)) {
    errors.push(`Davčna številka mora biti 8-mestna številka (dobljeno: "${taxNumber}").`);
  }

  const workflowId = text(xml, "DocumentWorkflowID");
  if (!workflowId) errors.push("Manjka DocumentWorkflowID.");

  const period = text(xml, "Period");
  if (!period) {
    errors.push("Manjka davčno obdobje (Period).");
  } else if (!/^\d{4}$/.test(period)) {
    errors.push(`Period mora biti 4-mestno leto (dobljeno: "${period}").`);
  }

  // ── IFI records (Doh-KDVP sale entries) ──────────────────────────
  const ifiBlocks = blocks(xml, "Row");
  if (ifiBlocks.length === 0) {
    warnings.push("XML ne vsebuje nobenih IFI vrstic (Row). Morda ni transakcij za izbrano leto.");
  }

  for (let i = 0; i < ifiBlocks.length; i++) {
    const b = ifiBlocks[i];
    const idx = i + 1;

    // F1 = acquisition date, F2 = disposal date
    const f1 = text(b, "F1");
    const f2 = text(b, "F2");
    checkDate(f1, `F1 (datum nakupa, vrstica ${idx})`, errors, warnings);
    checkDate(f2, `F2 (datum prodaje, vrstica ${idx})`, errors, warnings);

    if (f1 && f2 && new Date(f1) > new Date(f2)) {
      errors.push(`Vrstica ${idx}: datum nakupa (F1: ${f1}) je po datumu prodaje (F2: ${f2}).`);
    }

    // F3 = quantity sold, F4 = proceeds gross, F5 = cost basis, F7 = net proceeds, F8 = profit
    const f3 = text(b, "F3");
    const f4 = text(b, "F4");
    const f5 = text(b, "F5");

    checkPositiveDecimal(f3, `F3 (količina, vrstica ${idx})`, false, errors);
    checkPositiveDecimal(f4, `F4 (izkupiček, vrstica ${idx})`, true, errors);
    checkPositiveDecimal(f5, `F5 (nabavna vrednost, vrstica ${idx})`, true, errors);

    const f8 = text(b, "F8");
    if (f8 !== null) {
      const profit = parseFloat(f8);
      const proceeds = parseFloat(f4 ?? "0");
      const cost = parseFloat(f5 ?? "0");
      if (!isNaN(profit) && !isNaN(proceeds) && !isNaN(cost)) {
        const expected = parseFloat((proceeds - cost).toFixed(8));
        if (Math.abs(profit - expected) > 0.01) {
          warnings.push(`Vrstica ${idx}: F8 (${f8}) se ne ujema s F4 − F5 (${expected}). Preverite zaokroževanje.`);
        }
      }
    }
  }

  // ── VrednostniPapir blocks (security metadata) ────────────────────
  const vpBlocks = blocks(xml, "VrednostniPapir");
  for (let i = 0; i < vpBlocks.length; i++) {
    const b = vpBlocks[i];
    const idx = i + 1;

    const name = text(b, "Name");
    if (!name) warnings.push(`Vrednostni papir ${idx}: manjka Name (ime instrumenta).`);

    const isin = text(b, "ISIN");
    if (isin && !/^[A-Z]{2}[A-Z0-9]{9}\d$/.test(isin)) {
      warnings.push(`Vrednostni papir ${idx}: ISIN "${isin}" ni v standardnem formatu (ISO 6166).`);
    }

    const hasForeignTax = text(b, "HasForeignTax");
    if (hasForeignTax === null) {
      warnings.push(`Vrednostni papir ${idx}: manjka HasForeignTax.`);
    } else if (hasForeignTax !== "true" && hasForeignTax !== "false") {
      errors.push(`Vrednostni papir ${idx}: HasForeignTax mora biti "true" ali "false" (dobljeno: "${hasForeignTax}").`);
    }
  }

  // ── Plausibility ──────────────────────────────────────────────────
  const allF8 = allText(xml, "F8").map(Number).filter((n) => !isNaN(n));
  const totalProfit = allF8.reduce((s, n) => s + n, 0);
  if (allF8.length > 0 && Math.abs(totalProfit) > 1_000_000) {
    warnings.push(`Skupni P&L v XML je ${totalProfit.toFixed(2)} €. Preverite, ali so podatki pravilni.`);
  }

  return { valid: errors.length === 0, errors, warnings };
}
