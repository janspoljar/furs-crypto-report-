"use client";

import { useState, useRef } from "react";

const BROKERS = [
  { value: "etoro", label: "eToro", icon: "🟢", note: "Account Statement CSV" },
  { value: "trading212", label: "Trading212", icon: "🟠", note: "Trade History CSV" },
  { value: "revolut", label: "Revolut", icon: "🔷", note: "Trading CSV" },
  { value: "interactive-brokers", label: "Interactive Brokers", icon: "🔵", note: "Activity Report CSV" },
  { value: "trade-republic", label: "Trade Republic", icon: "⚫", note: "Kmalu podprto" },
  { value: "saxo", label: "Saxo Bank", icon: "🔴", note: "Kmalu podprto" },
  { value: "other", label: "Drugo", icon: "📄", note: "Splošni format" },
] as const;

type BrokerValue = (typeof BROKERS)[number]["value"];

export default function UploadPage() {
  const [broker, setBroker] = useState<BrokerValue>("etoro");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState<{ imported?: number; skipped?: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedBroker = BROKERS.find((b) => b.value === broker)!;

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) setSelectedFile(file);
  }

  async function handleUpload() {
    if (!selectedFile) {
      setErrorMessage("Izberi datoteko pred nalaganjem.");
      return;
    }

    setLoading(true);
    setSuccessMessage("");
    setErrorMessage("");
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("broker", broker);
      formData.append("file", selectedFile);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || res.statusText || "Upload ni uspel");
      }

      setSuccessMessage(
        `Uspešno uvoženo ${data?.imported ?? data?.count ?? "?"} transakcij.`
      );
      setResult(data);
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "Napaka pri nalaganju.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Uvoz transakcij</h1>
        <p className="mt-2 text-slate-500">
          Naloži CSV datoteko iz svoje borze. Avtomatsko razberemo transakcije in jih pripravimo za FIFO izračun.
        </p>
      </div>

      {/* Broker izbira */}
      <section className="mb-6">
        <label className="block text-sm font-semibold text-slate-700 mb-3">
          1. Izberi borzo
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {BROKERS.map((b) => (
            <button
              key={b.value}
              type="button"
              onClick={() => setBroker(b.value)}
              className={`flex flex-col items-center p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                broker === b.value
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-slate-200 bg-white text-slate-600 hover:border-blue-300"
              }`}
            >
              <span className="text-2xl mb-1">{b.icon}</span>
              <span>{b.label}</span>
              <span className="text-xs text-slate-400 mt-0.5 font-normal">{b.note}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Datoteka */}
      <section className="mb-6">
        <label className="block text-sm font-semibold text-slate-700 mb-3">
          2. Naloži CSV datoteko
        </label>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer border-2 border-dashed rounded-xl p-8 text-center transition-all ${
            dragging
              ? "border-blue-400 bg-blue-50"
              : selectedFile
              ? "border-green-400 bg-green-50"
              : "border-slate-300 bg-slate-50 hover:border-blue-300 hover:bg-blue-50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
          />
          {selectedFile ? (
            <>
              <div className="text-4xl mb-2">✅</div>
              <div className="font-semibold text-green-700">{selectedFile.name}</div>
              <div className="text-sm text-slate-500 mt-1">
                {(selectedFile.size / 1024).toFixed(1)} KB · Klikni za zamenjavo
              </div>
            </>
          ) : (
            <>
              <div className="text-4xl mb-2">📁</div>
              <div className="font-semibold text-slate-700">Povleci CSV sem ali klikni</div>
              <div className="text-sm text-slate-500 mt-1">
                {selectedBroker.label} — {selectedBroker.note}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Gumb */}
      <button
        type="button"
        onClick={handleUpload}
        disabled={loading || !selectedFile}
        className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 text-white font-bold py-3.5 rounded-xl text-base transition-colors"
      >
        {loading ? "Uvažam transakcije…" : `Uvozi iz ${selectedBroker.label}`}
      </button>

      {successMessage && (
        <div className="mt-6 flex items-start gap-3 p-4 rounded-xl border border-green-200 bg-green-50 text-green-800">
          <span className="text-xl">✅</span>
          <div>
            <div className="font-semibold">{successMessage}</div>
            {result?.skipped != null && result.skipped > 0 && (
              <div className="text-sm mt-1 text-green-700">Preskočenih (duplikati): {result.skipped}</div>
            )}
            <a href="/dashboard" className="text-sm underline text-green-700 mt-1 inline-block">
              Pojdi na nadzorno ploščo →
            </a>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="mt-6 flex items-start gap-3 p-4 rounded-xl border border-red-200 bg-red-50 text-red-800">
          <span className="text-xl">❌</span>
          <div>
            <div className="font-semibold">Napaka pri uvozu</div>
            <div className="text-sm mt-1">{errorMessage}</div>
          </div>
        </div>
      )}

      {/* Navodila */}
      <section className="mt-10 p-5 bg-slate-50 border border-slate-200 rounded-xl">
        <h3 className="font-semibold text-slate-800 mb-3">Kako pridobiti CSV iz {selectedBroker.label}?</h3>
        <BrokerInstructions broker={broker} />
      </section>
    </main>
  );
}

function BrokerInstructions({ broker }: { broker: BrokerValue }) {
  const instructions: Record<BrokerValue, { steps: string[] }> = {
    etoro: {
      steps: [
        "Pojdite na eToro → Portfolio → History",
        "Kliknite gumb 'Izvozi' (Export) zgoraj desno",
        "Izberite 'Account Statement' in nastavite celotno davčno leto",
        "Prenesite Excel datoteko in jo shranite kot CSV",
        "Podrobna navodila: /navodila/etoro",
      ],
    },
    trading212: {
      steps: [
        "Pojdite na Trading212 → History (ikona ure)",
        "Kliknite 'Export' v zgornjem desnem kotu",
        "Izberite celotno davčno leto ali 'All time'",
        "Prenesite CSV datoteko",
        "Podrobna navodila: /navodila/trading212",
      ],
    },
    revolut: {
      steps: [
        "Odprite Revolut aplikacijo → Profile → Documents",
        "Izberite 'Trading account statements'",
        "Nastavite datum od začetka do konca davčnega leta",
        "Izberite CSV format in prenesite",
        "Podrobna navodila: /navodila/revolut",
      ],
    },
    "interactive-brokers": {
      steps: [
        "Pojdite na IBKR → Reports → Flex Queries",
        "Ustvarite Activity Report za davčno leto",
        "Izberite CSV format",
        "Prenesite datoteko",
        "Podrobna navodila: /navodila/interactive-brokers",
      ],
    },
    "trade-republic": { steps: ["Podpora za Trade Republic prihaja kmalu. Prosimo počakajte."] },
    saxo: { steps: ["Podpora za Saxo Bank prihaja kmalu. Prosimo počakajte."] },
    other: { steps: ["Za nestandardne formate se obrnite na podporo prek email naslova."] },
  };

  const { steps } = instructions[broker] ?? { steps: [] };

  return (
    <ol className="space-y-2">
      {steps.map((step, i) => (
        <li key={i} className="flex gap-3 text-sm text-slate-600">
          <span className="font-bold text-blue-600 shrink-0">{i + 1}.</span>
          {step}
        </li>
      ))}
    </ol>
  );
}
