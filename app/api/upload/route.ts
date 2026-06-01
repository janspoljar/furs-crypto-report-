import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/route-handler";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { canUploadTransactions, FREE_TX_LIMIT } from "@/lib/subscription";

const DATE_KEYS = ["date", "time", "created at", "timestamp"];
const TYPE_KEYS = ["type", "action", "side"];
const ASSET_KEYS = ["asset", "ticker", "symbol", "instrument"];
const AMOUNT_KEYS = ["amount", "quantity", "qty", "shares", "units"];
const PRICE_KEYS = ["price", "total", "value", "amount eur", "price eur"];
const FEE_KEYS = ["fee", "commission", "cost"];

type NormalizedPreviewRow = {
  broker: string;
  date: string;
  type: string;
  asset: string;
  amount: number;
  priceEur: number;
  feeEur?: number;
  exchange?: string;
  note?: string;
  rawCsvRow: Record<string, string>;
};

function normalizeType(value: string) {
  const lower = value.toLowerCase();
  if (lower.includes("buy")) return "buy";
  if (lower.includes("sell")) return "sell";
  if (
    lower.includes("deposit") ||
    lower.includes("withdrawal") ||
    lower.includes("transfer")
  ) {
    return "transfer";
  }
  if (
    lower.includes("dividend") ||
    lower.includes("interest") ||
    lower.includes("staking")
  ) {
    return "staking";
  }
  return "fee";
}

function findValue(row: Record<string, string>, keys: string[]) {
  const originalKeys = Object.keys(row);
  const normalizedKeys = originalKeys.map((key) => key.toLowerCase().trim());

  for (const key of keys) {
    const index = normalizedKeys.indexOf(key);
    if (index !== -1) {
      return row[originalKeys[index]];
    }
  }

  return undefined;
}

function parseNumber(value: string | undefined) {
  if (!value) return 0;
  const cleaned = value.replace(/,/g, ".").replace(/[^0-9.-]/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function createRowObject(headers: string[], values: string[]) {
  const row: Record<string, string> = {};
  headers.forEach((header, index) => {
    row[header] = values[index] ?? "";
  });
  return row;
}

function normalizeRow(
  broker: string,
  row: Record<string, string>
): NormalizedPreviewRow | null {
  const date = findValue(row, DATE_KEYS);
  const typeRaw = findValue(row, TYPE_KEYS);
  const asset = findValue(row, ASSET_KEYS);
  const amount = parseNumber(findValue(row, AMOUNT_KEYS));
  const priceEur = parseNumber(findValue(row, PRICE_KEYS));
  const feeEur = parseNumber(findValue(row, FEE_KEYS));
  const exchange = row["exchange"] || row["market"] || undefined;
  const note = row["note"] || row["description"] || undefined;

  const hasUsefulFields = Boolean(date && asset && typeRaw);
  if (!hasUsefulFields) return null;

  return {
    broker,
    date: date ?? "",
    type: normalizeType(typeRaw ?? ""),
    asset: asset ?? "",
    amount,
    priceEur,
    feeEur: feeEur || undefined,
    exchange,
    note,
    rawCsvRow: row,
  };
}

function createImportKey(userId: string, row: NormalizedPreviewRow) {
  const feeString = row.feeEur != null ? row.feeEur.toString() : "";
  const exchangeString = row.exchange ?? "";
  return [
    userId,
    row.date,
    row.type,
    row.asset,
    row.amount.toString(),
    row.priceEur.toString(),
    feeString,
    exchangeString,
  ].join("|");
}

function normalizeTrading212Row(
  row: Record<string, string>
): NormalizedPreviewRow | null {
  const originalKeys = Object.keys(row);
  const normalizedKeys = originalKeys.map((key) => key.toLowerCase().trim());

  const findColumn = (candidates: string[]) => {
    for (const candidate of candidates) {
      const index = normalizedKeys.indexOf(candidate);
      if (index !== -1) {
        return row[originalKeys[index]];
      }
    }
    return undefined;
  };

  const date = findColumn(["date", "time", "created at", "timestamp", "execution time"]);
  const actionRaw = findColumn(["action", "type", "side", "operation"]);
  const asset = findColumn(["ticker", "instrument", "symbol", "isin", "name"]);
  const amountStr = findColumn([
    "number of shares",
    "no. of shares",
    "quantity",
    "qty",
    "shares",
    "units",
  ]);
  const priceStr = findColumn([
    "price per share",
    "price / share",
    "price",
    "rate",
    "share price",
  ]);
  const totalStr = findColumn(["total", "amount", "value", "result", "total amount"]);
  const feeStr = findColumn([
    "fee",
    "commission",
    "charge",
    "trading fee",
    "currency conversion fee",
    "withholding tax",
  ]);
  const currencyStr = findColumn(["currency", "curr"]);
  const exchange = findColumn(["exchange", "market", "venue"]);
  const note = findColumn(["note", "notes", "description", "comment"]);

  // Date and action are always required
  if (!date || !actionRaw) {
    return null;
  }

  const actionLower = actionRaw.toLowerCase();
  const normalizedActionType = normalizeType(actionRaw);

  // Determine if this is a deposit/withdrawal/dividend/interest type (no asset required)
  const isNonAssetTransaction =
    actionLower.includes("deposit") ||
    actionLower.includes("withdrawal") ||
    actionLower.includes("dividend") ||
    actionLower.includes("interest") ||
    actionLower.includes("staking");

  // For buy/sell, asset is required. For other types, it's optional.
  if (!isNonAssetTransaction && !asset) {
    return null;
  }

  const amount = parseNumber(amountStr);
  let priceEur = 0;

  if (priceStr) {
    priceEur = parseNumber(priceStr);
  } else if (totalStr && amount > 0) {
    priceEur = parseNumber(totalStr) / amount;
  } else if (totalStr) {
    priceEur = parseNumber(totalStr);
  }

  const feeEur = parseNumber(feeStr);

  return {
    broker: "trading212",
    date,
    type: normalizedActionType,
    asset: asset || `${actionRaw} (${currencyStr || "EUR"})`,
    amount,
    priceEur,
    feeEur: feeEur || undefined,
    exchange: exchange || undefined,
    note: note || actionRaw,
    rawCsvRow: row,
  };
}

function normalizeTradeRepublicRow(
  row: Record<string, string>
): NormalizedPreviewRow | null {
  const originalKeys = Object.keys(row);
  const normalizedKeys = originalKeys.map((key) => key.toLowerCase().trim());

  const findColumn = (candidates: string[]) => {
    for (const candidate of candidates) {
      const index = normalizedKeys.indexOf(candidate);
      if (index !== -1) {
        return row[originalKeys[index]];
      }
    }
    return undefined;
  };

  const date = findColumn([
    "date",
    "timestamp",
    "booking date",
    "created at",
    "time",
  ]);
  const actionRaw = findColumn([
    "type",
    "action",
    "transaction type",
    "operation",
  ]);
  const asset = findColumn([
    "symbol",
    "ticker",
    "instrument",
    "asset",
    "isin",
  ]);
  const amountStr = findColumn([
    "quantity",
    "shares",
    "units",
    "qty",
    "number of shares",
  ]);
  const priceStr = findColumn([
    "price",
    "execution price",
    "price per share",
    "rate",
    "unit price",
  ]);
  const totalStr = findColumn([
    "amount",
    "total",
    "value",
    "gross amount",
    "total amount",
  ]);
  const feeStr = findColumn([
    "fee",
    "commission",
    "costs",
    "cost",
    "broker fee",
  ]);
  const exchange = findColumn(["exchange", "market", "venue"]);
  const note = findColumn(["note", "description", "comment"]);

  if (!date || !actionRaw || !asset) {
    return null;
  }

  const amount = parseNumber(amountStr);
  let priceEur = 0;

  if (priceStr) {
    priceEur = parseNumber(priceStr);
  } else if (totalStr && amount > 0) {
    priceEur = parseNumber(totalStr) / amount;
  } else {
    priceEur = parseNumber(totalStr);
  }

  const feeEur = parseNumber(feeStr);

  return {
    broker: "trade-republic",
    date,
    type: normalizeType(actionRaw),
    asset,
    amount,
    priceEur,
    feeEur: feeEur || undefined,
    exchange: exchange || undefined,
    note: note || undefined,
    rawCsvRow: row,
  };
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  fields.push(current.trim());
  return fields;
}

export async function POST(req: Request) {
  try {
    const { user, error: authError } = await getAuthenticatedUser();

    if (authError || !user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;

    const formData = await req.formData();
    const broker = formData.get("broker");
    const file = formData.get("file");

    if (!broker || typeof broker !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid broker." },
        { status: 400 }
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Missing or invalid file." },
        { status: 400 }
      );
    }

    const fileName = file.name ?? "";
    if (!fileName.toLowerCase().endsWith(".csv")) {
      return NextResponse.json(
        { error: "File must be a .csv." },
        { status: 400 }
      );
    }

    const content = await file.text();
    const lines = content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    const previewLines = lines.slice(0, 5);
    const lineCount = lines.length;

    const headers = lines.length > 0 ? parseCSVLine(lines[0]) : [];
    const rowLines = lines.slice(1);
    const rows = rowLines.map((rowLine) => parseCSVLine(rowLine));

    const rowsPreview = rows
      .slice(0, 5)
      .map((rowValues) => createRowObject(headers, rowValues));

    const detectedHeaders = headers;

    const normalizedRows: Array<NormalizedPreviewRow | null> = rows.map((rowValues) => {
      const rowObject = createRowObject(headers, rowValues);

      if (broker === "trading212") {
        return normalizeTrading212Row(rowObject);
      }

      if (broker === "trade-republic") {
        return normalizeTradeRepublicRow(rowObject);
      }

      return normalizeRow(broker, rowObject);
    });

    const normalizedTransactionsPreview = normalizedRows
      .filter((row): row is NormalizedPreviewRow => row !== null)
      .slice(0, 5);

    // Filter out null rows and those without required fields (date and type)
    // asset is not required anymore for non-trading transactions (deposits, dividends, etc)
    const insertableRows = normalizedRows.filter(
      (row): row is NormalizedPreviewRow =>
        row !== null &&
        Boolean(row.date) &&
        Boolean(row.type)
    );

    const insertableRowsWithKey = insertableRows.map((row) => ({
      ...row,
      importKey: createImportKey(userId, row),
    }));

    const importKeys = insertableRowsWithKey.map((row) => row.importKey);
    const existingImportKeys = new Set<string>();
    let duplicateCount = 0;

    if (importKeys.length > 0) {
      const { data: existingRows, error: fetchError } = await supabaseAdmin
        .from("transactions")
        .select("import_key")
        .in("import_key", importKeys);

      if (fetchError) {
        return NextResponse.json({ error: fetchError.message }, { status: 500 });
      }

      existingRows?.forEach((row) => {
        if (row.import_key) {
          existingImportKeys.add(row.import_key);
        }
      });
    }

    const rowsToInsert = insertableRowsWithKey.filter(
      (row) => !existingImportKeys.has(row.importKey)
    );
    duplicateCount = insertableRowsWithKey.length - rowsToInsert.length;

    // Freemium gate: check transaction count limit for free plan
    const uploadAccess = await canUploadTransactions(userId, rowsToInsert.length);
    if (!uploadAccess.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Brezplačni plan je omejen na " + FREE_TX_LIMIT + " transakcij.",
          upgradeRequired: true,
          currentCount: uploadAccess.currentCount,
          remaining: uploadAccess.remaining,
          message:
            `Dosegili ste omejitev brezplačnega plana (${FREE_TX_LIMIT} transakcij). ` +
            `Trenutno imate ${uploadAccess.currentCount} transakcij. ` +
            `Nadgradite na Pro za neomejene transakcije.`,
        },
        { status: 403 }
      );
    }

    const dbRows = rowsToInsert.map((row) => {
      // Determine asset_type based on transaction type
      let assetType = "stock"; // default
      if (row.type === "staking") {
        assetType = "dividend";
      } else if (row.type === "transfer" || row.type === "fee") {
        assetType = "stock"; // neutral — keep as stock
      }

      return {
        user_id: userId,
        date: row.date,
        type: row.type,
        asset_type: assetType,
        asset: row.asset,
        amount: row.amount,
        price_eur: row.priceEur,
        fee_eur: row.feeEur ?? null,
        exchange: row.exchange ?? null,
        note: row.note ?? null,
        import_key: row.importKey,
      };
    });

    let insertedCount = 0;
    if (dbRows.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from("transactions")
        .insert(dbRows);

      if (insertError) {
        console.error("[Upload] Insert error:", insertError, "User ID:", userId, "Row count:", dbRows.length);
        // Check if it's a FK constraint issue
        if (insertError.message?.includes("foreign key") || insertError.message?.includes("user_id")) {
          return NextResponse.json(
            { error: "Auth user mismatch. Please try logging in again." },
            { status: 500 }
          );
        }
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      insertedCount = dbRows.length;
    }

    const rowsCount = rows.length;
    const unmappedRowsCount = normalizedRows.filter((row) => row === null).length;
    const skippedCount = unmappedRowsCount + duplicateCount;

    return NextResponse.json({
      success: true,
      broker,
      fileName,
      fileSize: file.size,
      lineCount,
      stats: {
        total: rowsCount,
        inserted: insertedCount,
        duplicates: duplicateCount,
        unmapped: unmappedRowsCount,
        skipped: skippedCount,
      },
      preview: {
        headers,
        rowsPreview,
        normalizedTransactionsPreview,
      },
      messages: {
        inserted: insertedCount > 0 ? `${insertedCount} transakcij uspešno uvoženih.` : "Nobena nova transakcija.",
        duplicates: duplicateCount > 0 ? `${duplicateCount} duplicirana(h) transakcij(e) preskočeni.` : "",
        unmapped: unmappedRowsCount > 0 ? `${unmappedRowsCount} vrstica(e) brez potrebnih podatkov.` : "",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Napaka pri uploadu.",
      },
      { status: 500 }
    );
  }
}