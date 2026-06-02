import type { Metadata } from "next";
import { getUserFromServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getSubscription } from "@/lib/subscription";
import OnboardingStepper from "@/components/onboarding-stepper";
import UploadZone from "./upload-zone";

export const metadata: Metadata = {
  title: "Uvoz CSV | DavkiNaDelnicah.si",
  description: "Naloži transakcijski izpisek iz Trading 212, Revolut, IBKR, Binance ali Coinbase.",
};

export default async function UploadPage() {
  const { user } = await getUserFromServer();

  let txCount = 0;
  let isPro = false;

  if (user) {
    const [{ count }, subscription] = await Promise.all([
      supabaseAdmin
        .from("transactions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
      getSubscription(user.id),
    ]);
    txCount = count ?? 0;
    isPro = subscription.isPro;
  }

  return (
    <main>
      <section className="page-head">
        <div className="wrap">
          <h1>Naloži izpisek transakcij</h1>
          <p>Povleci CSV datoteko, ki si jo izvozil pri svojem posredniku. Prepoznali bomo borzo, validirali zapise in pretvorili tuje valute v EUR.</p>
        </div>
      </section>

      <section className="wrap" style={{ paddingBottom: 80 }}>
        {user && (
          <OnboardingStepper txCount={txCount} isPro={isPro} />
        )}
        <UploadZone />
      </section>
    </main>
  );
}
