"use client";

import { useEffect } from "react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log to error monitoring (e.g. Sentry) without exposing to user
    console.error("[GlobalError]", error.digest ?? error.message);
  }, [error]);

  return (
    <main>
      <section className="notfound-section">
        <div>
          <div className="code" style={{ fontSize: 64, color: "var(--neg)" }}>!</div>
          <h1>Prišlo je do napake</h1>
          <p>
            Žal je prišlo do nepričakovane napake. Ekipa je bila obveščena.
            <br />
            Poskusite znova ali se vrnite na domačo stran.
          </p>
          {error.digest && (
            <p style={{ fontSize: 12, color: "var(--muted-2)", fontFamily: "var(--font-mono)", marginBottom: 24 }}>
              Koda napake: {error.digest}
            </p>
          )}
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="btn btn-primary" onClick={reset}>
              Poskusi znova
            </button>
            <a href="/" className="btn btn-ghost">Domača stran</a>
          </div>
        </div>
      </section>
    </main>
  );
}
