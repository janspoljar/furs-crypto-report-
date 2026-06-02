"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  xmlBase64: string;
  taxPayerId: string;
  maskedTaxId: string;
  year: number;
  actionUrl: string;
}

export default function EdavkiImportView({
  xmlBase64,
  taxPayerId,
  maskedTaxId,
  year,
  actionUrl,
}: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [countdown, setCountdown] = useState(3);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (submitted) return;
    if (countdown <= 0) {
      setSubmitted(true);
      formRef.current?.submit();
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, submitted]);

  function handleManualSubmit() {
    setSubmitted(true);
    formRef.current?.submit();
  }

  return (
    <div style={{ maxWidth: 560, margin: "0 auto" }}>
      {/* Status bar */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        background: submitted ? "var(--pos-tint)" : "var(--surface)",
        border: `1px solid ${submitted ? "var(--pos)" : "var(--line)"}`,
        borderRadius: "var(--r-md)", padding: "12px 16px",
        marginBottom: 24, fontSize: 13,
      }}>
        {submitted ? (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--pos)" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0 }}>
              <path d="M20 6 9 17l-5-5"/>
            </svg>
            <span style={{ color: "var(--pos)", fontWeight: 600 }}>Preusmerjamo v eDavke…</span>
          </>
        ) : (
          <>
            <span style={{
              width: 20, height: 20, borderRadius: "50%",
              background: "var(--accent)", color: "#fff",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700, flexShrink: 0,
            }}>
              {countdown}
            </span>
            <span style={{ color: "var(--muted)" }}>
              Samodejno preusmerjanje čez <strong style={{ color: "var(--ink)" }}>{countdown}s</strong>…
            </span>
          </>
        )}
      </div>

      {/* Checklist */}
      <div style={{
        background: "var(--surface)", border: "1px solid var(--line)",
        borderRadius: "var(--r-lg)", padding: "20px 24px", marginBottom: 20,
      }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 14 }}>Pregled pred pošiljanjem</div>
        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { label: "XML je bil ustvarjen za davčno leto", value: String(year) },
            { label: "Davčna številka zavezanca", value: maskedTaxId },
            { label: "Tip zavezanca", value: "FO (fizična oseba)" },
            { label: "Uvozni endpoint", value: "Uradni eDavki portal" },
          ].map(({ label, value }) => (
            <li key={label} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--pos)" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0 }}>
                <path d="M20 6 9 17l-5-5"/>
              </svg>
              <span style={{ color: "var(--muted)", flex: 1 }}>{label}</span>
              <span style={{ color: "var(--ink)", fontWeight: 600, fontFamily: "var(--font-mono, monospace)", fontSize: 12 }}>{value}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Notes */}
      <div style={{
        background: "var(--surface)", border: "1px solid var(--line)",
        borderRadius: "var(--r-md)", padding: "14px 18px", marginBottom: 24,
        fontSize: 13, color: "var(--muted)", lineHeight: 1.6,
        display: "flex", flexDirection: "column", gap: 8,
      }}>
        <div style={{ display: "flex", gap: 8 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--warn)" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 2 }}>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span>Po zaključku vas eDavki <strong>ne vrne samodejno</strong> nazaj na DavkiNaDelnicah.si.</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 2 }}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          <span>Če se odpre prijavna stran eDavki, je to <strong>pričakovano</strong> — prijavite se z obstoječim računom.</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 2 }}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          <span>Vaš XML bo uvožen kot osnutek — preglejte in oddajte ga v eDavkah.</span>
        </div>
      </div>

      {/* CTAs */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button
          onClick={handleManualSubmit}
          disabled={submitted}
          className="btn btn-primary"
          style={{ flex: "1 1 auto" }}
        >
          {submitted ? "Preusmerjamo…" : "Nadaljuj v eDavke"}
          <span className="arr">→</span>
        </button>
        <a href="/reports" className="btn btn-line" style={{ flex: "0 0 auto" }}>
          Nazaj na poročila
        </a>
      </div>

      {/* Hidden POST form — never rendered visibly */}
      <form ref={formRef} method="POST" action={actionUrl} style={{ display: "none" }}>
        <input type="hidden" name="ImportDocument" value={xmlBase64} />
        <input type="hidden" name="TaxPayerID" value={taxPayerId} />
        <input type="hidden" name="TaxPayerType" value="FO" />
      </form>
    </div>
  );
}
