"use client";

import { useTransition } from "react";
import { createCheckoutSession } from "./actions";

export default function CheckoutButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={() => startTransition(() => createCheckoutSession())}
      className="cta"
    >
      <button
        type="submit"
        className="btn btn-primary cta"
        disabled={isPending}
        style={{ width: "100%" }}
      >
        {isPending ? (
          "Preusmerjam na Stripe…"
        ) : (
          <>Plačaj 19 € · enkratno <span className="arr">→</span></>
        )}
      </button>
    </form>
  );
}
