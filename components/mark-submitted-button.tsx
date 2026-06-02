"use client";

import { useState, useTransition } from "react";
import { toggleReportSubmission } from "@/app/reports/actions";

interface Props {
  year: number;
  initialSubmittedAt: string | null;
}

export default function MarkSubmittedButton({ year, initialSubmittedAt }: Props) {
  const [submittedAt, setSubmittedAt] = useState<string | null>(initialSubmittedAt);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      const result = await toggleReportSubmission(year);
      setSubmittedAt(result.submittedAt);
    });
  }

  if (submittedAt) {
    const dateLabel = new Date(submittedAt).toLocaleDateString("sl-SI", {
      day: "numeric", month: "short", year: "numeric",
    });
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginTop: 6 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "var(--pos)", fontWeight: 600 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M20 6 9 17l-5-5"/>
          </svg>
          Označeno kot oddano · {dateLabel}
        </div>
        <button
          onClick={handleToggle}
          disabled={isPending}
          style={{
            fontSize: 11, color: "var(--muted)", background: "none", border: "none",
            cursor: isPending ? "default" : "pointer", padding: 0, textDecoration: "underline",
          }}
        >
          {isPending ? "…" : "Razveljavi"}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      style={{
        display: "inline-flex", alignItems: "center", gap: 5, marginTop: 6,
        fontSize: 12, color: "var(--muted)", background: "none",
        border: "1px solid var(--line)", borderRadius: 4,
        padding: "3px 9px", cursor: isPending ? "default" : "pointer",
      }}
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <polyline points="9 11 12 14 22 4"/>
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
      </svg>
      {isPending ? "…" : "Označi kot oddano"}
    </button>
  );
}
