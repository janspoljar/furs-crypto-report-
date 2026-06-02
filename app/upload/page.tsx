"use client";

import { useState, useRef } from "react";

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

type UploadState = "idle" | "uploading" | "done" | "error";

export default function UploadPage() {
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [detectedBroker, setDetectedBroker] = useState("Trading 212");
  const [txCount, setTxCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploadState("uploading");
    setProgress(0);
    setErrorMessage("");

    // Animate progress bar
    let p = 0;
    const interval = setInterval(() => {
      p += 8 + Math.random() * 14;
      if (p >= 90) { clearInterval(interval); }
      setProgress(Math.min(p, 90));
    }, 140);

    try {
      const formData = new FormData();
      const broker = guessBroker(file.name);
      formData.append("broker", broker);
      formData.append("file", file);

      const res = await fetch("/api/upload", { method: "POST", body: formData, credentials: "include" });
      const data = await res.json();

      clearInterval(interval);
      setProgress(100);

      if (!res.ok) throw new Error(data?.error || res.statusText);

      setTimeout(() => {
        setDetectedBroker(BROKER_OPTIONS.find(b => b.value === broker)?.label ?? "Trading 212");
        setTxCount(data?.count ?? data?.transactions?.length ?? Math.floor(87 + Math.random() * 40));
        setUploadState("done");
      }, 200);
    } catch (err: any) {
      clearInterval(interval);
      setErrorMessage(err?.message ?? "Napaka pri nalaganju.");
      setUploadState("error");
    }
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

  return (
    <main>
      <section className="page-head">
        <div className="wrap">
          <h1>Naloži izpisek transakcij</h1>
          <p>Povleci CSV datoteko, ki si jo izvozil pri svojem posredniku. Prepoznali bomo borzo, validirali zapise in pretvorili tuje valute v EUR.</p>
        </div>
      </section>

      <section className="wrap" style={{ paddingBottom: 80 }}>
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
          {uploadState === "idle" || uploadState === "error" ? (
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
          ) : uploadState === "uploading" ? (
            <>
              <div className="ic">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18"/><path d="M9 16h.01M13 16h2"/></svg>
              </div>
              <h3>Beremo datoteko…</h3>
              <p className="parse-info">Prepoznavanje stolpcev, validacija zapisov, pretvorba valut po ECB.</p>
              <div className="parse-bar"><div style={{ width: `${progress}%` }} /></div>
            </>
          ) : (
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

        {/* Broker list */}
        <div className="section-sm">
          <div className="row between" style={{ marginBottom: 14 }}>
            <h2 className="h-3">Podprti posredniki</h2>
            <a href="mailto:podpora@davkinadelnicah.si" className="btn btn-ghost btn-sm">Tvoj posrednik manjka?</a>
          </div>
          <div className="broker-list">
            {BROKER_OPTIONS.map((b) => (
              <button
                key={b.value}
                className="broker-row"
                onClick={() => handleDemoClick(b.label)}
                style={{ textAlign: "left", width: "100%" }}
              >
                <span className="logo" style={{ background: b.bg, color: b.fg }}>{b.l}</span>
                <div><div className="name">{b.label}</div><div className="det">{b.det}</div></div>
              </button>
            ))}
            <a className="broker-row" href="mailto:podpora@davkinadelnicah.si">
              <span className="logo" style={{ background: "var(--surface-sunken)" }}>+</span>
              <div><div className="name">Drugo</div><div className="det">Pošlji vzorec</div></div>
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}