"use client";

import { useEffect, useState } from "react";

const STEPS = [
  { label: "Uvozi CSV", desc: "Naloži izpisek iz svojega posrednika" },
  { label: "Preveri transakcije", desc: "Preglej FIFO izračun in P&L" },
  { label: "Prenesi XML", desc: "Izvozi DOH-KDVP za eDavki" },
];

interface Props {
  txCount: number;
  isPro: boolean;
}

export default function OnboardingStepper({ txCount, isPro }: Props) {
  const [dismissed, setDismissed] = useState(true); // start hidden to avoid flash

  useEffect(() => {
    try {
      setDismissed(sessionStorage.getItem("stepper-dismissed") === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  // Hide when: dismissed, or Pro user who has already imported transactions
  if (dismissed || (isPro && txCount > 0)) return null;

  const activeStep = txCount === 0 ? 0 : isPro ? 2 : 1;

  function dismiss() {
    try { sessionStorage.setItem("stepper-dismissed", "1"); } catch {}
    setDismissed(true);
  }

  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--line)",
      borderRadius: "var(--r-lg)",
      padding: "20px 24px",
      margin: "0 0 24px",
      display: "flex",
      alignItems: "center",
      gap: 0,
      position: "relative",
    }}>
      {/* Dismiss */}
      <button
        onClick={dismiss}
        aria-label="Zapri"
        style={{
          position: "absolute", top: 12, right: 12,
          color: "var(--muted)", lineHeight: 1, padding: 4,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>

      {/* Steps */}
      <div style={{ display: "flex", alignItems: "center", flex: 1, gap: 0, flexWrap: "wrap", rowGap: 12 }}>
        {STEPS.map((step, idx) => {
          const isDone = idx < activeStep;
          const isActive = idx === activeStep;
          const isFuture = idx > activeStep;

          return (
            <div key={idx} style={{ display: "flex", alignItems: "center" }}>
              {/* Connector line */}
              {idx > 0 && (
                <div style={{
                  width: 32,
                  height: 2,
                  background: isDone ? "var(--pos)" : "var(--line)",
                  margin: "0 8px",
                  flexShrink: 0,
                }} />
              )}

              {/* Step item */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {/* Circle */}
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  flexShrink: 0,
                  display: "grid",
                  placeItems: "center",
                  fontSize: 12,
                  fontWeight: 700,
                  ...(isDone ? {
                    background: "var(--pos-tint)",
                    color: "var(--pos)",
                    border: "none",
                  } : isActive ? {
                    background: "var(--accent)",
                    color: "#fff",
                    border: "none",
                  } : {
                    background: "transparent",
                    color: "var(--muted-2)",
                    border: "1.5px solid var(--line-strong)",
                  }),
                }}>
                  {isDone ? (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>

                {/* Label */}
                <div>
                  <div style={{
                    fontSize: 13.5,
                    fontWeight: isActive ? 700 : 500,
                    color: isDone ? "var(--muted)" : isActive ? "var(--ink)" : "var(--muted-2)",
                    lineHeight: 1.2,
                    ...(isDone ? { textDecoration: "line-through", textDecorationColor: "var(--line-strong)" } : {}),
                  }}>
                    {step.label}
                  </div>
                  {isActive && (
                    <div style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 1 }}>
                      {step.desc}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
