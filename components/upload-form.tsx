"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { FREE_TX_LIMIT } from "@/lib/constants";
import { detectBrokerFromCsv } from "@/lib/parsers/detect";
import type { BrokerType } from "@/lib/types";

const BROKERS: { value: BrokerType; label: string; icon: string }[] = [
  { value: "etoro", label: "eToro", icon: "🟢" },
  { value: "trading212", label: "Trading212", icon: "🟠" },
  { value: "revolut", label: "Revolut", icon: "🔷" },
  { value: "interactive-brokers", label: "Interactive Brokers", icon: "🔵" },
  { value: "trade-republic", label: "Trade Republic", icon: "⚫" },
  { value: "n26", label: "N26", icon: "🟤" },
  { value: "saxo", label: "Saxo Bank", icon: "🔴" },
  { value: "other", label: "Drugo", icon: "📄" },
];

interface Props {
  isPro: boolean;
  txCount: number;
}

export default function UploadForm({ isPro, txCount }: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [detectedBroker, setDetectedBroker] = useState<BrokerType | null>(null);
  const [manualBroker, setManualBroker] = useState<BrokerType | null>(null);
  const [showOverride, setShowOverride] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [upgradeRequired, setUpgradeRequired] = useState(false);
  const [result, setResult] = useState<{ imported?: number; skipped?: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeBroker = manualBroker ?? detectedBroker;
  const activeBrokerLabel = BROKERS.find((b) => b.value === activeBroker)?.label ?? "Neznana borza";
  const txRemaining = isPro ? Infinity : Math.max(0, FREE_TX_LIMIT - txCount);
  const usagePct = isPro ? 0 : Math.min(100, (txCount / FREE_TX_LIMIT) * 100);

  async function handleFileSelect(file: File) {
    setSelectedFile(file);
    setDetectedBroker(null);
    setManualBroker(null);
    setShowOverride(false);
    setSuccessMessage("");
    setErrorMessage("");
    setResult(null);

    const text = await file.text();
    const detection = detectBrokerFromCsv(text);
    setDetectedBroker(detection.broker);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  }

  async function handleUpload() {
    if (!selectedFile) {
      setErrorMessage("Izberi datoteko pred nalaganjem.");
      return;
    }
    if (!activeBroker) {
      setErrorMessage("Borza ni bila prepoznana. Izberi jo ročno spodaj.");
      setShowOverride(true);
      return;
    }
    setLoading(true);
    setSuccessMessage("");
    setErrorMessage("");
    setUpgradeRequired(false);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("broker", activeBroker);
      formData.append("file", selectedFile);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const data = await res.json();

      if (!res.ok) {
        if (data?.upgradeRequired) {
          setUpgradeRequired(true);
          return;
        }
        throw new Error(data?.error || res.statusText || "Upload ni uspel");
      }

      setSuccessMessage(`Uspešno uvoženo ${data?.imported ?? data?.count ?? "?"} transakcij.`);
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
          Povleci CSV datoteko — sistem samodejno prepozna borzo in uvozi transakcije.
        </p>
      </div>

      {/* Kvota */}
      {!isPro && (
        <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-700">Porabljene transakcije (brezplačni plan)</span>
            <span className="text-sm font-mono text-slate-600">{txCount} / {FREE_TX_LIMIT}</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${usagePct >= 90 ? "bg-red-500" : usagePct >= 70 ? "bg-amber-500" : "bg-blue-500"}`}
              style={{ width: `${usagePct}%` }}
            />
          </div>
          {txRemaining <= 20 && txRemaining > 0 && (
            <p className="text-xs text-amber-700 mt-2">
              Ostane še {txRemaining} transakcij. <Link href="/#cenik" className="underline font-medium">Nadgradi na Pro.</Link>
            </p>
          )}
          {txRemaining === 0 && (
            <p className="text-xs text-red-700 mt-2 font-medium">
              Dosegli ste omejitev. <Link href="/#cenik" className="underline">Nadgradi na Pro</Link> za neomejene transakcije.
            </p>
          )}
        </div>
      )}
      {isPro && (
        <div className="mb-6 flex items-center gap-2 px-4 py-2.5 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800 font-medium">
          <span>✓</span> Pro plan — neomejeno transakcij
        </div>
      )}

      {/* Drag & drop cona */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`cursor-pointer border-2 border-dashed rounded-2xl p-10 text-center transition-all mb-4 ${
          dragging ? "border-blue-400 bg-blue-50"
          : selectedFile ? "border-green-400 bg-green-50"
          : "border-slate-300 bg-slate-50 hover:border-blue-300 hover:bg-blue-50"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
        />
        {selectedFile ? (
          <>
            <div className="text-4xl mb-3">📄</div>
            <div className="font-semibold text-slate-800">{selectedFile.name}</div>
            <div className="text-sm text-slate-500 mt-1">{(selectedFile.size / 1024).toFixed(1)} KB · Klikni za zamenjavo</div>
          </>
        ) : (
          <>
            <div className="text-4xl mb-3">⬆️</div>
            <div className="font-semibold text-slate-700 text-lg">Povleci CSV sem ali klikni</div>
            <div className="text-sm text-slate-500 mt-2">Podprto: eToro, Trading212, Revolut, IBKR, Trade Republic, N26, Saxo</div>
          </>
        )}
      </div>

      {/* Prepoznana borza */}
      {selectedFile && (
        <div className="mb-5 p-4 rounded-xl border border-slate-200 bg-white">
          {activeBroker ? (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold text-slate-700">Prepoznana borza:</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-800 rounded-full font-semibold text-xs">
                  {BROKERS.find(b => b.value === activeBroker)?.icon} {activeBrokerLabel}
                  {manualBroker && <span className="text-green-600 ml-1">(ročno)</span>}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowOverride(!showOverride)}
                className="text-xs text-blue-600 hover:underline"
              >
                {showOverride ? "Skrij" : "Ni prav?"}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-amber-700">
                <span>⚠️</span>
                <span>Borza ni bila samodejno prepoznana. Izberi jo ročno.</span>
              </div>
              <button
                type="button"
                onClick={() => setShowOverride(true)}
                className="text-xs text-blue-600 hover:underline"
              >
                Izberi borzo
              </button>
            </div>
          )}

          {/* Ročni override */}
          {showOverride && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <p className="text-xs text-slate-500 mb-2">Izberi borzo ročno:</p>
              <div className="flex flex-wrap gap-2">
                {BROKERS.map((b) => (
                  <button
                    key={b.value}
                    type="button"
                    onClick={() => { setManualBroker(b.value); setShowOverride(false); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      activeBroker === b.value
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-slate-200 bg-white text-slate-600 hover:border-blue-300"
                    }`}
                  >
                    {b.icon} {b.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Gumb */}
      <button
        type="button"
        onClick={handleUpload}
        disabled={loading || !selectedFile || (!isPro && txRemaining === 0)}
        className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 text-white font-bold py-3.5 rounded-xl text-base transition-colors"
      >
        {loading ? "Uvažam transakcije…" : activeBroker ? `Uvozi iz ${activeBrokerLabel}` : "Uvozi transakcije"}
      </button>

      {upgradeRequired && (
        <div className="mt-6 rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 text-center">
          <div className="text-4xl mb-3">🔒</div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Dosegli ste omejitev brezplačnega plana</h3>
          <p className="text-slate-600 text-sm mb-5 max-w-sm mx-auto">
            Brezplačni plan omogoča do {FREE_TX_LIMIT} transakcij. Nadgradite na Pro za neomejene transakcije in XML izvoz.
          </p>
          <Link href="/#cenik" className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-3 rounded-xl transition-colors">
            Nadgradi na Pro — 19 €/leto →
          </Link>
        </div>
      )}

      {successMessage && (
        <div className="mt-6 flex items-start gap-3 p-4 rounded-xl border border-green-200 bg-green-50 text-green-800">
          <span className="text-xl">✅</span>
          <div>
            <div className="font-semibold">{successMessage}</div>
            {result?.skipped != null && result.skipped > 0 && (
              <div className="text-sm mt-1 text-green-700">Preskočenih (duplikati): {result.skipped}</div>
            )}
            <Link href="/dashboard" className="text-sm underline text-green-700 mt-1 inline-block">Pojdi na nadzorno ploščo →</Link>
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

      {/* Navodila za izvoz */}
      <section className="mt-8 p-5 bg-slate-50 border border-slate-200 rounded-xl">
        <h3 className="font-semibold text-slate-800 mb-1">Kako pridobiti CSV?</h3>
        <p className="text-sm text-slate-500 mb-4">Podrobna navodila za vsako borzo posebej:</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { href: "/navodila/etoro", label: "eToro", icon: "🟢" },
            { href: "/navodila/trading212", label: "Trading212", icon: "🟠" },
            { href: "/navodila/revolut", label: "Revolut", icon: "🔷" },
            { href: "/navodila/interactive-brokers", label: "IBKR", icon: "🔵" },
            { href: "/navodila/trade-republic", label: "Trade Republic", icon: "⚫" },
            { href: "/navodila/n26", label: "N26", icon: "🟤" },
            { href: "/navodila/uvoz-edavki", label: "Uvoz na eDavke", icon: "📤" },
          ].map((g) => (
            <Link key={g.href} href={g.href} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-slate-200 hover:border-blue-300 text-sm text-slate-700 font-medium no-underline transition-colors">
              {g.icon} {g.label}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
