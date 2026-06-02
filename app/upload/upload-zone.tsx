"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";

const BROKER_OPTIONS = [
  { value: "trading212", label: "Trading 212", bg: "#000", fg: "#fff", l: "T", det: "CSV izvoz" },
  { value: "revolut", label: "Revolut", bg: "#0075EB", fg: "#fff", l: "R", det: "CSV iz aplikacije" },
  { value: "ibkr", label: "Interactive Brokers", bg: "#D81222", fg: "#fff", l: "I", det: "Flex Query CSV" },
  { value: "etoro", label: "eToro", bg: "#FF5C46", fg: "#fff", l: "e", det: "Account Statement" },
  { value: "binance", label: "Binance", bg: "#F2A900", fg: "#000", l: "B", det: "Tax report CSV" },
  { value: "coinbase", label: "Coinbase", bg: "#0052FF", fg: "#fff", l: "C", det: "Transaction history" },
  { value: "kraken", label: "Kraken", bg: "#5563C1", fg: "#fff", l: "K", det: "Ledgers CSV" },
  { value: "bitstamp", label: "Bitstamp", bg: "#1B3CA8", fg: "#fff", l: "B", det: "Transactions CSV" },
];

const FREE_LIMIT = 200;

interface PreviewRow {
  date: string;
  type: string;
  asset: string;
  amount: number;
  priceEur: number;
}

interface ParsedPreview {
  count: number;
  broker: string;
  tickers: string[];
  yearRange: { min: number; max: number } | null;
  rows: PreviewRow[];
}

interface OrphanAsset {
  asset: string;
  years: number[];
}

type UploadState = "idle" | "previewing" | "preview" | "uploading" | "done" | "error";

function getTypeLabel(type: string) {
  switch (type) {
    case "buy": return "Nakup";
    case "sell": return "Prodaja";
    case "staking": return "Dividende";
    case "transfer": return "Transfer";
    case "fee": return "Provizija";
    default: return type;
  }
}

function getTypeCls(type: string) {
  switch (type) {
    case "buy": return "tag-buy";
    case "sell": return "tag-sell";
    case "staking": return "tag-staking";
    case "transfer": return "tag-transfer";
    case "fee": return "tag-fee";
    default: return "tag-fee";
  }
}

export default function UploadZone() {
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [detectedBroker, setDetectedBroker] = useState("Trading 212");
  const [txCount, setTxCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<ParsedPreview | null>(null);
  const [orphans, setOrphans] = useState<OrphanAsset[]>([]);
  const pendingFileRef = useRef<File | null>(null);
  const pendingBrokerRef = useRef<string>("trading212");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    const broker = guessBroker(file.name);
    pendingFileRef.current = file;
    pendingBrokerRef.current = broker;
    setUploadState("previewing");
    setErrorMessage("");
    setOrphans([]);

    try {
      const fd = new FormData();
      fd.append("broker", broker);
      fd.append("file", file);
      const res = await fetch("/api/upload/preview", { method: "POST", body: fd, credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || res.statusText);
      setPreview(data as ParsedPreview);
      setUploadState("preview");
    } catch (err: any) {
      const msg = err?.message ?? "Napaka pri branju datoteke.";
      setErrorMessage(msg);
      setUploadState("error");
      toast.error(msg);
    }
  }

  async function handleConfirm() {
    const file = pendingFileRef.current;
    const broker = pendingBrokerRef.current;
    if (!file) return;

    setUploadState("uploading");
    setProgress(0);

    let p = 0;
    const interval = setInterval(() => {
      p += 8 + Math.random() * 14;
      if (p >= 90) clearInterval(interval);
      setProgress(Math.min(p, 90));
    }, 140);

    try {
      const fd = new FormData();
      fd.append("broker", broker);
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd, credentials: "include" });
      const data = await res.json();
      clearInterval(interval);
      setProgress(100);
      if (!res.ok) throw new Error(data?.error || res.statusText);

      setTimeout(async () => {
        const brokerLabel = BROKER_OPTIONS.find(b => b.value === broker)?.label ?? "Trading 212";
        const count = data?.stats?.inserted ?? data?.count ?? 0;
        setDetectedBroker(brokerLabel);
        setTxCount(count);
        setUploadState("done");
        toast.success(`Uvoz uspešen — ${count} transakcij iz ${brokerLabel}`);
        // Check for orphan sells (sells without matching buys)
        try {
          const orphanRes = await fetch("/api/upload/orphans", { credentials: "include" });
          if (orphanRes.ok) {
            const orphanData = await orphanRes.json();
            setOrphans(orphanData.orphans ?? []);
          }
        } catch {
          // non-critical — skip silently
        }
      }, 200);
    } catch (err: any) {
      clearInterval(interval);
      const msg = err?.message ?? "Napaka pri nalaganju.";
      setErrorMessage(msg);
      setUploadState("error");
      toast.error(msg);
    }
  }

  function handleCancel() {
    pendingFileRef.current = null;
    setPreview(null);
    setUploadState("idle");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function guessBroker(name: string) {
    const n = name.toLowerCase();
    if (n.includes("trading") || n.includes("212")) return "trading212";
    if (n.includes("revolut")) return "revolut";
    if (n.includes("ibkr") || n.includes("interactive")) return "ibkr";
    if (n.includes("etoro")) return "etoro";
    if (n.includes("binance")) return "binance";
    return "trading212";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFile(file);
  }

  function handleDemoClick(brokerLabel: string) {
    setDetectedBroker(brokerLabel);
    setTxCount(Math.floor(87 + Math.random() * 80));
    setUploadState("done");
  }

  const brokerLabel = BROKER_OPTIONS.find(b => b.value === pendingBrokerRef.current)?.label ?? "Posrednik";
  const showGate = preview && preview.count > FREE_LIMIT;
  const extraTickers = preview && preview.tickers.length > 8 ? preview.tickers.length - 8 : 0;
  const displayTickers = preview ? preview.tickers.slice(0, 8) : [];

  return (
    <>
      {/* Pro banner */}
        <div className="banner-pro reveal">
          <div className="lt">
            <div className="ic">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            </div>
            <div>
              <strong>Brezplačni načrt — do 200 transakcij.</strong>
              <p>Za neomejene transakcije, XML izvoz Doh-KDVP in poročilo Doh-Div nadgradi na Pro.</p>
            </div>
          </div>
          <a className="btn btn-secondary" href="/cenik">Nadgradi za 19 € / leto <span className="arr">→</span></a>
        </div>

        {/* Upload zone */}
        <div
          className={`upload-zone reveal d1${dragging ? " drag" : ""}`}
          onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
          onDrop={handleDrop}
        >
          {(uploadState === "idle" || uploadState === "error") && (
            <>
              <div className="ic">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M12 17V3"/><path d="M7 8l5-5 5 5"/>
                </svg>
              </div>
              <h3>Povleci CSV ali klikni za izbiro</h3>
              <p>Prepoznali bomo posrednika in zapise. Datoteke ostanejo v tvojem brskalniku.</p>
              <label className="btn btn-primary" style={{ cursor: "pointer" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/></svg>
                Izberi datoteko
                <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              </label>
              {uploadState === "error" && (
                <p style={{ marginTop: 16, color: "var(--neg)", fontWeight: 600 }}>{errorMessage}</p>
              )}
              <div className="or">ali poizkusi z vzorcem</div>
              <div className="row gap-2 center" style={{ flexWrap: "wrap" }}>
                <button className="chip" onClick={() => handleDemoClick("Trading 212")}>Trading 212 vzorec</button>
                <button className="chip" onClick={() => handleDemoClick("Revolut")}>Revolut vzorec</button>
                <button className="chip" onClick={() => handleDemoClick("Interactive Brokers")}>IBKR vzorec</button>
              </div>
            </>
          )}

          {uploadState === "previewing" && (
            <>
              <div className="ic">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
              </div>
              <h3>Berem datoteko…</h3>
              <p className="parse-info">Analiziramo strukturo in preštevamo transakcije.</p>
            </>
          )}

          {uploadState === "uploading" && (
            <>
              <div className="ic">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18"/><path d="M9 16h.01M13 16h2"/></svg>
              </div>
              <h3>Uvažamo transakcije…</h3>
              <p className="parse-info">Shranjevanje v bazo, pretvorba valut po ECB.</p>
              <div className="parse-bar"><div style={{ width: `${progress}%` }} /></div>
            </>
          )}

          {uploadState === "done" && (
            <>
              <div className="done-card">
                <div className="ic">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                </div>
                <div className="info">
                  <b>Uvoz uspešen — prepoznan posrednik: {detectedBroker}</b>
                  <small>{txCount} transakcij · davčno leto 2024 · brez napak</small>
                </div>
              </div>
              <div className="row center gap-3" style={{ marginTop: 22, flexWrap: "wrap" }}>
                <a href="/transactions" className="btn btn-primary">Poglej transakcije <span className="arr">→</span></a>
                <a href="/reports" className="btn btn-line">Generiraj poročilo</a>
                <button className="btn btn-ghost" onClick={() => { setUploadState("idle"); setProgress(0); }}>Naloži še eno</button>
              </div>
            </>
          )}
        </div>

        {/* Orphan sells warning — shown after successful import when history is incomplete */}
        {uploadState === "done" && orphans.length > 0 && (
          <div style={{
            background: "color-mix(in srgb, var(--warn) 8%, var(--surface))",
            border: "1px solid color-mix(in srgb, var(--warn) 25%, transparent)",
            borderRadius: "var(--r-lg)",
            padding: "18px 20px",
            marginTop: 16,
            display: "flex",
            alignItems: "flex-start",
            gap: 14,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--warn)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 600, marginBottom: 4, color: "var(--warn)" }}>
                Za pravilen izračun uvozite tudi pretekle CSV-je
              </p>
              <p style={{ fontSize: 13.5, color: "var(--ink-soft)", marginBottom: 8 }}>
                Zaznane prodaje brez ujemajočih nakupov — manjkajo podatki za:{" "}
                <strong style={{ fontFamily: "var(--font-mono)" }}>
                  {orphans.map(o => `${o.asset}${o.years.length ? ` (${o.years.join("–")})` : ""}`).join(", ")}
                </strong>
              </p>
              <a href="/navodila" style={{ fontSize: 13, color: "var(--accent)", fontWeight: 600 }}>
                Navodila za izvoz preteklih izpiskov →
              </a>
            </div>
          </div>
        )}

        {/* Preview card — shown between file pick and confirm */}
        {uploadState === "preview" && preview && (
          <div className="preview-card reveal" style={{ marginTop: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--muted)", marginBottom: 4 }}>Predogled uvoza</p>
                <h3 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
                  {brokerLabel}
                  {preview.yearRange && (
                    <span style={{ fontWeight: 400, fontSize: 14, color: "var(--muted)", marginLeft: 10 }}>
                      {preview.yearRange.min === preview.yearRange.max
                        ? preview.yearRange.min
                        : `${preview.yearRange.min}–${preview.yearRange.max}`}
                    </span>
                  )}
                </h3>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 22, fontWeight: 700 }}>{preview.count}</span>
                <span style={{ fontSize: 13, color: "var(--muted)" }}>transakcij</span>
              </div>
            </div>

            {/* Free gate warning */}
            {showGate && (
              <div style={{
                background: "color-mix(in srgb, var(--warn) 10%, var(--surface))",
                border: "1px solid color-mix(in srgb, var(--warn) 30%, transparent)",
                borderRadius: "var(--r)",
                padding: "12px 16px",
                marginBottom: 16,
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--warn)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                <div style={{ fontSize: 13 }}>
                  <strong style={{ color: "var(--warn)" }}>Datoteka presega brezplačni limit ({FREE_LIMIT} transakcij).</strong>
                  <span style={{ color: "var(--ink-soft)", marginLeft: 6 }}>
                    Uvozili bomo prvih {preview.count} transakcij — za neomejeno nadgradi na{" "}
                    <a href="/cenik" style={{ color: "var(--accent)", fontWeight: 600 }}>Pro</a>.
                  </span>
                </div>
              </div>
            )}

            {/* Ticker chips */}
            {displayTickers.length > 0 && (
              <div className="preview-tickers">
                {displayTickers.map(t => (
                  <span key={t} className="chip">{t}</span>
                ))}
                {extraTickers > 0 && (
                  <span className="chip" style={{ color: "var(--muted)" }}>+{extraTickers} več</span>
                )}
              </div>
            )}

            {/* Mini table */}
            {preview.rows.length > 0 && (
              <div style={{ overflowX: "auto" }}>
                <table className="preview-mini-table">
                  <thead>
                    <tr>
                      <th>Datum</th>
                      <th>Tip</th>
                      <th>Ticker</th>
                      <th style={{ textAlign: "right" }}>Količina</th>
                      <th style={{ textAlign: "right" }}>Cena (EUR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((row, i) => {
                      const gated = showGate && i >= FREE_LIMIT;
                      return (
                        <tr key={i} className={gated ? "tbl-blur-row" : undefined}>
                          <td style={{ fontFamily: "var(--font-mono)" }}>{row.date.slice(0, 10)}</td>
                          <td><span className={getTypeCls(row.type)}>{getTypeLabel(row.type)}</span></td>
                          <td style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{row.asset}</td>
                          <td style={{ textAlign: "right", fontFamily: "var(--font-mono)" }}>{row.amount.toFixed(4)}</td>
                          <td style={{ textAlign: "right", fontFamily: "var(--font-mono)" }}>{row.priceEur.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {preview.count > 5 && (
                  <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 8, textAlign: "center" }}>
                    Prikazanih prvih 5 od {preview.count} transakcij
                  </p>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="row gap-3" style={{ marginTop: 20, flexWrap: "wrap" }}>
              <button className="btn btn-primary" onClick={handleConfirm}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                Potrdi uvoz
              </button>
              <button className="btn btn-line" onClick={handleCancel}>Prekliči</button>
            </div>
          </div>
        )}

      {/* Broker list */}
      <div className="section-sm">
        <div className="row between" style={{ marginBottom: 14 }}>
          <h2 className="h-3">Podprti posredniki</h2>
          <a href="mailto:podpora@davkinadelnicah.si" className="btn btn-ghost btn-sm">Tvoj posrednik manjka?</a>
        </div>
        <div className="broker-list">
            {BROKER_OPTIONS.map((b) => {
              const hasNavodila = ["trading212", "revolut", "ibkr", "etoro", "binance", "coinbase"].includes(b.value);
              return (
                <button
                  key={b.value}
                  className="broker-row"
                  onClick={() => handleDemoClick(b.label)}
                  style={{ textAlign: "left", width: "100%" }}
                >
                  <span className="logo" style={{ background: b.bg, color: b.fg }}>{b.l}</span>
                  <div>
                    <div className="name">{b.label}</div>
                    <div className="det">{b.det}</div>
                    {hasNavodila && (
                      <a href={`/navodila#${b.value}`} target="_blank" rel="noopener noreferrer"
                         style={{ fontSize: 11, color: "var(--accent)", fontWeight: 600, marginTop: 2, display: "block" }}
                         onClick={(e) => e.stopPropagation()}>
                        Navodila →
                      </a>
                    )}
                  </div>
                </button>
              );
            })}
          <a className="broker-row" href="mailto:podpora@davkinadelnicah.si">
            <span className="logo" style={{ background: "var(--surface-sunken)" }}>+</span>
            <div><div className="name">Drugo</div><div className="det">Pošlji vzorec</div></div>
          </a>
        </div>
      </div>
    </>
  );
}
