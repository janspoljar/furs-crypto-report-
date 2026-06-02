"use client";
import { useState } from "react";

interface Props {
  date: string;
  asset: string;
  priceEur: number;
  broker: string;
  isPro: boolean;
}

export default function TransactionEcbBadge({ date, asset, priceEur, broker, isPro }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-start" }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: "inline-flex", alignItems: "center", gap: 3,
          fontSize: 10, fontWeight: 700, letterSpacing: "0.04em",
          color: "var(--accent)", background: "var(--accent-tint, rgba(59,130,246,0.1))",
          border: "1px solid currentColor", borderRadius: 3,
          padding: "1px 5px", cursor: "pointer", lineHeight: 1.4,
        }}
        title="Pretvorjeno po ECB tečaju"
      >
        ECB
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          {open ? <path d="M18 15l-6-6-6 6"/> : <path d="M6 9l6 6 6-6"/>}
        </svg>
      </button>

      {open && (
        <div style={{
          position: "absolute", zIndex: 50,
          background: "var(--bg)", border: "1px solid var(--line)",
          borderRadius: "var(--r-md)", padding: "12px 14px",
          marginTop: 4, minWidth: 240, fontSize: 12,
          boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
        }}>
          {isPro ? (
            <>
              <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 13 }}>Podrobnosti ECB konverzije</div>
              <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 12px", color: "var(--muted)" }}>
                <span>Datum:</span><span style={{ color: "var(--ink)", fontFamily: "var(--font-mono, monospace)" }}>{new Date(date).toLocaleDateString("sl-SI")}</span>
                <span>Instrument:</span><span style={{ color: "var(--ink)", fontFamily: "var(--font-mono, monospace)" }}>{asset}</span>
                <span>Cena v EUR:</span><span style={{ color: "var(--ink)", fontFamily: "var(--font-mono, monospace)" }}>{priceEur.toFixed(2)} €</span>
                <span>Posrednik:</span><span style={{ color: "var(--ink)", textTransform: "capitalize" }}>{broker}</span>
                <span>Vir:</span><span style={{ color: "var(--ink)" }}>ECB referenčni tečaj</span>
              </div>
              <p style={{ margin: "8px 0 0", color: "var(--muted)", fontSize: 11, lineHeight: 1.5 }}>
                Cena v EUR je bila določena po referenčnem tečaju ECB na datum transakcije.
              </p>
            </>
          ) : (
            <div style={{ position: "relative" }}>
              <div style={{ filter: "blur(3px)", userSelect: "none", pointerEvents: "none" }}>
                <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 13 }}>Podrobnosti ECB konverzije</div>
                <div>Datum: ██████</div>
                <div>Tečaj ECB: ██████</div>
                <div>Originalni znesek: ██████</div>
              </div>
              <div style={{
                position: "absolute", inset: 0, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 6,
              }}>
                <span style={{ fontSize: 10, fontWeight: 700, background: "var(--accent)", color: "#fff", borderRadius: 3, padding: "2px 6px" }}>Pro</span>
                <a href="/cenik" style={{ fontSize: 11, color: "var(--accent)" }}>Odkleni z Pro →</a>
              </div>
            </div>
          )}
        </div>
      )}
    </span>
  );
}
