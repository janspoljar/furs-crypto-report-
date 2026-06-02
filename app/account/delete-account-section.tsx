"use client";

import { useState, useTransition } from "react";
import { deleteAccount } from "./actions";

export default function DeleteAccountSection() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [inputText, setInputText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    setError(null);
    startTransition(async () => {
      const result = await deleteAccount(inputText);
      if (result?.error) {
        setError(result.error);
      }
    });
  };

  if (!showConfirm) {
    return (
      <button
        className="btn btn-danger btn-sm"
        onClick={() => setShowConfirm(true)}
      >
        Izbriši račun
      </button>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <p style={{ fontSize: 13, color: "var(--ink-soft)", margin: 0 }}>
        Za potrditev vpišite{" "}
        <strong style={{ color: "var(--neg)", fontFamily: "var(--font-mono, monospace)" }}>
          IZBRIŠI
        </strong>{" "}
        v polje spodaj:
      </p>

      <input
        type="text"
        value={inputText}
        onChange={(e) => {
          setInputText(e.target.value);
          setError(null);
        }}
        placeholder="IZBRIŠI"
        disabled={isPending}
        style={{
          padding: "9px 12px",
          fontSize: 14,
          border: "1px solid var(--line)",
          borderRadius: 8,
          background: "var(--surface)",
          color: "var(--ink)",
          outline: "none",
          fontFamily: "var(--font-mono, monospace)",
          letterSpacing: ".04em",
        }}
        autoFocus
      />

      {error && (
        <div
          style={{
            fontSize: 13,
            color: "var(--neg)",
            padding: "8px 12px",
            background: "color-mix(in srgb, var(--neg) 8%, transparent)",
            border: "1px solid color-mix(in srgb, var(--neg) 25%, transparent)",
            borderRadius: 7,
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <button
          className="btn btn-danger btn-sm"
          onClick={handleDelete}
          disabled={isPending || inputText !== "IZBRIŠI"}
        >
          {isPending ? "Brišem…" : "Potrdi brisanje"}
        </button>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => {
            setShowConfirm(false);
            setInputText("");
            setError(null);
          }}
          disabled={isPending}
        >
          Prekliči
        </button>
      </div>
    </div>
  );
}
