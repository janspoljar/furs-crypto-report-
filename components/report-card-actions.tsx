"use client";

import { useState, useTransition } from "react";
import { validateReportXml } from "@/app/reports/actions";

interface Props {
  year: number;
  isPro: boolean;
}

type State = "idle" | "validating" | "valid" | "warning" | "error";

export default function ReportCardActions({ year, isPro }: Props) {
  const [state, setState] = useState<State>("idle");
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleValidate() {
    startTransition(async () => {
      setState("validating");
      setErrors([]);
      setWarnings([]);
      setErrorMsg(null);

      const result = await validateReportXml(year);

      if (result.gated) {
        // shouldn't happen since the button is hidden for Free, but guard anyway
        setState("idle");
        return;
      }
      if (!result.ok || result.error) {
        setState("error");
        setErrorMsg(result.error ?? "Validacija ni uspela.");
        return;
      }
      const v = result.validation!;
      setErrors(v.errors);
      setWarnings(v.warnings);
      setState(v.valid ? (v.warnings.length > 0 ? "warning" : "valid") : "error");
    });
  }

  async function handleDownload() {
    try {
      const params = new URLSearchParams({ year: String(year) });
      const res = await fetch(`/api/reports/doh-kdvp/xml?${params}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrorMsg((data as any)?.error ?? `Napaka ${res.status}`);
        setState("error");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Doh_KDVP_${year}.xml`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setErrorMsg(err?.message ?? "Napaka pri prenosu.");
      setState("error");
    }
  }

  if (!isPro) {
    return (
      <div className="row-actions">
        <a href={`/reports/preview?year=${year}`} className="btn btn-line btn-sm" style={{ flex: "0 0 auto" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>
          Pregled
        </a>
        <div style={{ flex: 1, position: "relative" }}>
          <button className="btn btn-primary btn-sm" disabled style={{ width: "100%" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Prenesi XML
          </button>
          <span className="pro-pill">Pro</span>
        </div>
      </div>
    );
  }

  const canDownload = state === "valid" || state === "warning";
  const isValidating = isPending || state === "validating";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div className="row-actions">
        <a href={`/reports/preview?year=${year}`} className="btn btn-line btn-sm" style={{ flex: "0 0 auto" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>
          Pregled
        </a>

        {state === "idle" && (
          <button className="btn btn-primary btn-sm" onClick={handleValidate} style={{ flex: 1 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
            Preveri XML
          </button>
        )}

        {isValidating && (
          <button className="btn btn-primary btn-sm" disabled style={{ flex: 1 }}>
            Preverjam…
          </button>
        )}

        {(state === "valid" || state === "warning") && (
          <button className="btn btn-primary btn-sm" onClick={handleDownload} style={{ flex: 1 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12M12 15l-4-4M12 15l4-4"/><path d="M5 21h14"/></svg>
            Prenesi XML
          </button>
        )}

        {state === "error" && (
          <button className="btn btn-line btn-sm" onClick={handleValidate} style={{ flex: 1 }}>
            Poskusi znova
          </button>
        )}
      </div>

      {/* Validation feedback */}
      {state === "valid" && warnings.length === 0 && (
        <div className="val-ok">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M20 6 9 17l-5-5"/></svg>
          XML je veljaven — pripravljen za eDavki
        </div>
      )}

      {state === "warning" && warnings.length > 0 && (
        <div className="val-warn">
          <div className="val-head">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            Opozorila ({warnings.length}) — prenos možen
          </div>
          <ul>
            {warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}

      {state === "error" && (errors.length > 0 || errorMsg) && (
        <div className="val-error">
          <div className="val-head">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {errors.length > 0 ? `Napake (${errors.length}) — prenos blokiran` : "Napaka validacije"}
          </div>
          {errorMsg && <p>{errorMsg}</p>}
          {errors.length > 0 && (
            <ul>
              {errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
