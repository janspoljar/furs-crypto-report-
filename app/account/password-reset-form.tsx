"use client";

import { useActionState } from "react";
import { sendPasswordReset } from "./actions";

const initialState: { error?: string; success?: boolean } = {};

export default function PasswordResetForm() {
  const [state, formAction, isPending] = useActionState(
    async (_prev: typeof initialState) => {
      return await sendPasswordReset();
    },
    initialState
  );

  return (
    <form action={formAction}>
      <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 12, marginTop: 0 }}>
        Pošljemo vam e-pošto s povezavo za nastavitev novega gesla.
      </p>

      {state.success && (
        <div
          style={{
            fontSize: 14,
            color: "var(--pos)",
            background: "color-mix(in srgb, var(--pos) 8%, transparent)",
            border: "1px solid color-mix(in srgb, var(--pos) 25%, transparent)",
            borderRadius: 8,
            padding: "10px 14px",
            marginBottom: 12,
          }}
        >
          E-pošta za ponastavitev gesla je bila poslana.
        </div>
      )}

      {state.error && (
        <div
          style={{
            fontSize: 14,
            color: "var(--neg)",
            background: "color-mix(in srgb, var(--neg) 8%, transparent)",
            border: "1px solid color-mix(in srgb, var(--neg) 25%, transparent)",
            borderRadius: 8,
            padding: "10px 14px",
            marginBottom: 12,
          }}
        >
          {state.error}
        </div>
      )}

      <button type="submit" className="btn btn-line btn-sm" disabled={isPending}>
        {isPending ? "Pošiljam…" : "Spremeni geslo"}
      </button>
    </form>
  );
}
