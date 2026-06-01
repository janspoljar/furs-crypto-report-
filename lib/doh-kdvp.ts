import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import { ExportResponse } from "./report-exporter";
import { FifoResult, Transaction as FifoTransaction } from "./fifo";
import type { TaxpayerProfile } from "./types";

let cachedLibxmljsModule: any = null;

async function getLibxmljs() {
  if (cachedLibxmljsModule) {
    return cachedLibxmljsModule;
  }

  try {
    // Use an indirect/dynamic import via Function to avoid bundlers
    // statically analyzing and eagerly including the native module.
    // This keeps import side-effects off top-level module evaluation.
    const mod = await new Function('return import("libxmljs2")')();
    cachedLibxmljsModule = mod.default ?? mod;
    return cachedLibxmljsModule;
  } catch (err: any) {
    const message = err?.message ?? String(err);
    throw new Error(`XML validator dependency load failed: ${message}`);
  }
}

export interface TaxpayerMetadata {
  taxNumber?: string | null;
  fullName?: string | null;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  country?: string | null;
}

export interface AcquisitionRow {
  date: string; // ISO
  quantity: number;
  costPerUnit: number;
  totalCost: number;
  fee?: number;
}

export interface DisposalRow {
  date: string; // ISO
  quantity: number;
  grossProceeds: number;
  netProceeds: number;
  grossCost: number;
  netCost: number;
  profit: number;
  warning?: string | null;
  unmatchedQuantity?: number;
}

export interface InstrumentDraft {
  asset: string;
  ticker?: string | null;
  isin?: string | null;
  acquisitions: AcquisitionRow[];
  disposals: DisposalRow[];
  openQuantity?: number;
  warnings?: string[];
}

export interface DohKdvpDraft {
  taxpayer: TaxpayerMetadata;
  reportYear: number | null;
  instruments: InstrumentDraft[];
  notes?: string[];
  warnings?: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function buildDohKdvpDraftFromExport(
  exportModel: ExportResponse,
  options?: {
    year?: number;
    fifo?: FifoResult;
    transactions?: FifoTransaction[];
    taxpayer?: TaxpayerMetadata | TaxpayerProfile;
  }
): DohKdvpDraft {
  const year = options?.year ?? null;
  const fifo = options?.fifo;
  const transactions = options?.transactions ?? [];
  const taxpayer = options?.taxpayer;

  const draft: DohKdvpDraft = {
    taxpayer: {
      taxNumber: taxpayer?.taxNumber ?? null,
      fullName: taxpayer?.fullName ?? null,
      address: taxpayer?.address ?? null,
      city: taxpayer?.city ?? null,
      postalCode: taxpayer?.postalCode ?? null,
      country: taxpayer?.country ?? null,
    },
    reportYear: year,
    instruments: [],
    notes: [],
    warnings: [],
  };

  // Find matching years from exportModel
  const years = exportModel.years || [];
  const targetYears = year ? years.filter((y) => y.year === year) : years;

  if (targetYears.length === 0) {
    draft.warnings!.push(
      year
        ? `No export data available for year ${year}. Draft will be empty.`
        : "No export data available."
    );
    return draft;
  }

  // Build instruments by grouping sales and acquisitions per asset
  const instrumentMap = new Map<string, InstrumentDraft>();

  for (const y of targetYears) {
    for (const s of y.sales) {
      const asset = s.asset;
      if (!instrumentMap.has(asset)) {
        instrumentMap.set(asset, {
          asset,
          ticker: null,
          isin: null,
          acquisitions: [],
          disposals: [],
          openQuantity: 0,
          warnings: [],
        });
      }

      const instr = instrumentMap.get(asset)!;

      // Map disposal row from export sale
      instr.disposals.push({
        date: s.sellDate,
        quantity: s.soldQuantity,
        grossProceeds: s.grossProceeds,
        netProceeds: s.netProceeds,
        grossCost: s.grossCost,
        netCost: s.netCost,
        profit: s.profit,
        warning: s.warning ?? null,
        unmatchedQuantity: s.unmatchedQuantity ?? 0,
      });

      if (s.unmatchedQuantity && s.unmatchedQuantity > 0) {
        instr.warnings!.push(
          `Sale on ${s.sellDate} has unmatched quantity ${s.unmatchedQuantity}`
        );
      }
    }
  }

  // Attempt to include acquisitions from transactions (if provided)
  if (transactions && transactions.length > 0) {
    const buyTxs = transactions.filter((t) => t.type === "buy");
    for (const b of buyTxs) {
      const asset = b.asset;
      if (!instrumentMap.has(asset)) {
        instrumentMap.set(asset, {
          asset,
          ticker: null,
          isin: null,
          acquisitions: [],
          disposals: [],
          openQuantity: 0,
          warnings: [],
        });
      }
      const instr = instrumentMap.get(asset)!;
      const qty = Number(b.amount ?? 0);
      const pricePerUnit = Number(b.priceEur ?? 0);
      const fee = b.feeEur ?? 0;
      instr.acquisitions.push({
        date: new Date(b.date).toISOString(),
        quantity: qty,
        costPerUnit: pricePerUnit,
        totalCost: Number((qty * pricePerUnit).toFixed(8)),
        fee: fee || undefined,
      });
      instr.openQuantity = Number(((instr.openQuantity ?? 0) + qty).toFixed(8));
    }
  } else {
    // if no transactions present, note missing acquisition details
    draft.warnings!.push(
      "Acquisition (buy) transaction details are not present in the export model. Acquisition lists are incomplete."
    );
  }

  // If fifo is present, attempt to attach acquisition references per disposal
  if (fifo) {
    // Map fifo.sales to help provide acquisition breakdowns
    const fifoSales = fifo.sales || [];

    for (const fs of fifoSales) {
      const asset = fs.asset;
      const instr = instrumentMap.get(asset);
      if (!instr) continue;

      // find corresponding disposal by date and amount
      const match = instr.disposals.find(
        (d) => d.date === fs.date.toISOString() && Math.abs(d.quantity - fs.amountSold) < 1e-8
      );

      if (match) {
        // Add acquisitions as comments/warnings in the disposal if available
        if ((fs.acquisitions && fs.acquisitions.length > 0)) {
          // Optionally, we could add acquisition breakdown to disposal via warning string
          const acqLines = fs.acquisitions.map((a) => `${a.amount}@${a.costPerUnit.toFixed(8)} (from ${a.date.toISOString()})`);
          match.warning = (match.warning ? match.warning + "; " : "") + `Acquisitions: ${acqLines.join(", ")}`;
        }
      }
    }
  }

  draft.instruments = Array.from(instrumentMap.values());

  // Mark instruments without acquisitions or disposals
  for (const instr of draft.instruments) {
    if ((!instr.acquisitions || instr.acquisitions.length === 0) && (!instr.disposals || instr.disposals.length === 0)) {
      instr.warnings = instr.warnings || [];
      instr.warnings.push("Instrument has no acquisitions or disposals in the selected year.");
    }
  }

  return draft;
}

export function validateDohKdvpDraft(draft: DohKdvpDraft): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!draft.reportYear) {
    warnings.push("reportYear is empty; caller should set the target year before export.");
  }

  if (!draft.taxpayer || !draft.taxpayer.taxNumber) {
    errors.push("Davčna številka zavezanca je obvezna za XML export.");
  }
  if (!draft.taxpayer || !draft.taxpayer.fullName) {
    errors.push("Ime in priimek zavezanca je obvezno za XML export.");
  }
  if (!draft.taxpayer || !draft.taxpayer.address) {
    errors.push("Naslov zavezanca je obvezen za XML export.");
  }
  if (!draft.taxpayer || !draft.taxpayer.city) {
    errors.push("Kraj zavezanca je obvezen za XML export.");
  }
  if (!draft.taxpayer || !draft.taxpayer.postalCode) {
    errors.push("Poštna številka zavezanca je obvezna za XML export.");
  }
  if (!draft.taxpayer || !draft.taxpayer.country) {
    errors.push("Država zavezanca je obvezna za XML export.");
  }

  if (!draft.instruments || draft.instruments.length === 0) {
    warnings.push("No instruments included in draft.");
  }

  for (const instr of draft.instruments) {
    if ((!instr.acquisitions || instr.acquisitions.length === 0) && (!instr.disposals || instr.disposals.length === 0)) {
      warnings.push(`Instrument ${instr.asset} has no acquisition or disposal rows.`);
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

export interface XmlSerializeResult {
  success: boolean;
  xml?: string;
  error?: string;
}

export interface XmlSchemaValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  validatorError?: string;
}

const DOH_KDVP_XSD_PATH = path.resolve(process.cwd(), "lib", "Doh_KDVP_9.xsd");
const DOH_KDVP_NAMESPACE = "http://edavki.durs.si/Documents/Schemas/Doh_KDVP_9.xsd";

async function loadDohKdvpSchema() {
  const libxmljs = await getLibxmljs();
  const schemaText = fs.readFileSync(DOH_KDVP_XSD_PATH, "utf8");
  return libxmljs.parseXml(schemaText, {
    baseUrl: pathToFileURL(DOH_KDVP_XSD_PATH).href,
  });
}

export async function ensureXmlValidatorAvailable(): Promise<{ valid: boolean; error?: string }> {
  try {
    await getLibxmljs();
    return { valid: true };
  } catch (err: any) {
    return { valid: false, error: err?.message ?? String(err) };
  }
}

export async function validateDohKdvpXml(xml: string): Promise<XmlSchemaValidationResult> {
  try {
    if (!fs.existsSync(DOH_KDVP_XSD_PATH)) {
      return {
        valid: false,
        errors: [`Schema file not found: ${DOH_KDVP_XSD_PATH}`],
        warnings: [],
      };
    }

    const libxmljs = await getLibxmljs();
    const xsdDoc = await loadDohKdvpSchema();
    const xmlDoc = libxmljs.parseXml(xml);
    const valid = xmlDoc.validate(xsdDoc);

    const mapError = (e: any) => ({
      message: e?.message?.trim?.() ?? String(e),
      line: typeof e?.line === "number" ? e.line : null,
      column: typeof e?.column === "number" ? e.column : null,
      level: e?.level ?? null,
    });

    return {
      valid,
      errors: valid ? [] : xmlDoc.validationErrors.map(mapError),
      warnings: [],
    };
  } catch (err: any) {
    const message = err?.message ?? String(err);
    if (message.startsWith("XML validator dependency load failed")) {
      return {
        valid: false,
        errors: [{ message }],
        warnings: [],
        validatorError: message,
      };
    }
    return {
      valid: false,
      errors: [{ message }],
      warnings: [],
    };
  }
}

export function serializeDohKdvpDraftToXml(draft: DohKdvpDraft): XmlSerializeResult {
  try {
    if (!draft.reportYear) {
      return { success: false, error: "reportYear is required" };
    }

    if (!draft.instruments || draft.instruments.length === 0) {
      return { success: false, error: "At least one instrument must be present" };
    }

    const escapeXml = (str: string | null | undefined): string => {
      if (!str) return "";
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
    };

    const formatDate = (isoDate: string): string => {
      return isoDate.split("T")[0];
    };

    const inventoryType = "PLVP";
    const securityCount = draft.instruments.filter((instr) =>
      (instr.acquisitions && instr.acquisitions.length > 0) ||
      (instr.disposals && instr.disposals.length > 0)
    ).length;

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += `<Envelope xmlns="${DOH_KDVP_NAMESPACE}" xmlns:edp="http://edavki.durs.si/Documents/Schemas/EDP-Common-1.xsd">\n`;
    xml += "  <edp:Header>\n";
    xml += "    <edp:taxpayer>\n";
    if (draft.taxpayer.taxNumber) {
      xml += `      <edp:taxNumber>${escapeXml(draft.taxpayer.taxNumber)}</edp:taxNumber>\n`;
    }
    if (draft.taxpayer.fullName) {
      xml += `      <edp:name>${escapeXml(draft.taxpayer.fullName)}</edp:name>\n`;
    }
    if (draft.taxpayer.address) {
      xml += `      <edp:address1>${escapeXml(draft.taxpayer.address)}</edp:address1>\n`;
    }
    if (draft.taxpayer.city) {
      xml += `      <edp:city>${escapeXml(draft.taxpayer.city)}</edp:city>\n`;
    }
    if (draft.taxpayer.postalCode) {
      xml += `      <edp:postNumber>${escapeXml(draft.taxpayer.postalCode)}</edp:postNumber>\n`;
    }
    if (draft.taxpayer.city) {
      xml += `      <edp:postName>${escapeXml(draft.taxpayer.city)}</edp:postName>\n`;
    }
    if (draft.taxpayer.country) {
      xml += `      <edp:countryID>${escapeXml(draft.taxpayer.country)}</edp:countryID>\n`;
      xml += `      <edp:countryName>${escapeXml(draft.taxpayer.country)}</edp:countryName>\n`;
    }
    xml += "    </edp:taxpayer>\n";
    xml += "  </edp:Header>\n";
    xml += "  <edp:Signatures>\n";
    xml += "    <edp:NonEDP>\n";
    xml += "      <edp:receipt>\n";
    xml += `        <edp:timestamp>${new Date().toISOString()}</edp:timestamp>\n`;
    xml += "        <edp:documentNumber>0</edp:documentNumber>\n";
    xml += "      </edp:receipt>\n";
    xml += "    </edp:NonEDP>\n";
    xml += "  </edp:Signatures>\n";
    xml += "  <body>\n";
    xml += "    <edp:bodyContent/>\n";
    xml += "    <Doh_KDVP>\n";
    xml += "      <KDVP>\n";
    xml += `        <Year>${draft.reportYear}</Year>\n`;
    xml += `        <SecurityCount>${securityCount}</SecurityCount>\n`;
    xml += "        <SecurityShortCount>0</SecurityShortCount>\n";
    xml += "        <SecurityWithContractCount>0</SecurityWithContractCount>\n";
    xml += "        <SecurityWithContractShortCount>0</SecurityWithContractShortCount>\n";
    xml += "        <ShareCount>0</ShareCount>\n";
    xml += "      </KDVP>\n";

    let itemIndex = 1;
    for (const instr of draft.instruments) {
      const hasRows =
        (instr.acquisitions && instr.acquisitions.length > 0) ||
        (instr.disposals && instr.disposals.length > 0);
      if (!hasRows) {
        continue;
      }

      xml += "      <KDVPItem>\n";
      xml += `        <ItemID>${itemIndex++}</ItemID>\n`;
      xml += `        <InventoryListType>${inventoryType}</InventoryListType>\n`;
      xml += `        <Name>${escapeXml(instr.asset)}</Name>\n`;
      xml += "        <Securities>\n";
      if (instr.isin) {
        xml += `          <ISIN>${escapeXml(instr.isin)}</ISIN>\n`;
      }
      if (instr.ticker) {
        xml += `          <Code>${escapeXml(instr.ticker)}</Code>\n`;
      }
      xml += `          <Name>${escapeXml(instr.asset)}</Name>\n`;
      xml += "          <IsFond>false</IsFond>\n";

      let rowIndex = 1;
      if (instr.acquisitions) {
        for (const acq of instr.acquisitions) {
          xml += "          <Row>\n";
          xml += `            <ID>${rowIndex++}</ID>\n`;
          xml += "            <Purchase>\n";
          xml += `              <F1>${formatDate(acq.date)}</F1>\n`;
          xml += "              <F2>B</F2>\n";
          xml += `              <F3>${acq.quantity.toFixed(8)}</F3>\n`;
          xml += `              <F4>${acq.costPerUnit.toFixed(8)}</F4>\n`;
          if (acq.fee !== undefined && acq.fee > 0) {
            xml += `              <F5>${acq.fee.toFixed(4)}</F5>\n`;
          }
          xml += "            </Purchase>\n";
          xml += "          </Row>\n";
        }
      }

      if (instr.disposals) {
        for (const disp of instr.disposals) {
          if (disp.quantity === 0) {
            continue;
          }
          const unitValue = disp.grossProceeds / disp.quantity;
          xml += "          <Row>\n";
          xml += `            <ID>${rowIndex++}</ID>\n`;
          xml += "            <Sale>\n";
          xml += `              <F6>${formatDate(disp.date)}</F6>\n`;
          xml += `              <F7>${disp.quantity.toFixed(8)}</F7>\n`;
          xml += `              <F9>${unitValue.toFixed(8)}</F9>\n`;
          xml += "            </Sale>\n";
          xml += "          </Row>\n";
        }
      }

      xml += "        </Securities>\n";
      xml += "      </KDVPItem>\n";
    }

    xml += "    </Doh_KDVP>\n";
    xml += "  </body>\n";
    xml += "</Envelope>";

    return { success: true, xml };
  } catch (err: any) {
    return { success: false, error: err?.message ?? String(err) };
  }
}
