import type { Metadata } from "next";
import { requireUser } from "@/lib/supabase/server";
import { getSubscription } from "@/lib/subscription";
import SignOutButton from "./sign-out-button";
import PasswordResetForm from "./password-reset-form";
import DeleteAccountSection from "./delete-account-section";

export const metadata: Metadata = {
  title: "Moj račun — DavkiNaDelnicah.si",
  description: "Upravljajte z vašim računom, naročnino in varnostnimi nastavitvami.",
};

function formatDate(date: Date | null): string {
  if (!date) return "—";
  return date.toLocaleDateString("sl-SI", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function AccountPage() {
  const user = await requireUser();
  const subscription = await getSubscription(user.id);

  return (
    <main className="wrap" style={{ paddingBottom: 64 }}>
      <div className="page-head">
        <h1>Moj račun</h1>
        <p>Upravljajte z vašim računom, naročnino in varnostnimi nastavitvami.</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 640 }}>

        {/* --- Vaš račun --- */}
        <section className="panel">
          <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 16 }}>Vaš račun</h2>
          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                fontSize: 13,
                color: "var(--muted)",
                marginBottom: 4,
                textTransform: "uppercase",
                letterSpacing: ".04em",
              }}
            >
              E-poštni naslov
            </div>
            <div
              style={{
                fontSize: 15,
                color: "var(--ink)",
                padding: "10px 14px",
                background: "var(--surface)",
                border: "1px solid var(--line)",
                borderRadius: 8,
                fontWeight: 500,
              }}
            >
              {user.email}
            </div>
          </div>
          <SignOutButton />
        </section>

        {/* --- Naročnina --- */}
        <section className="panel">
          <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 16 }}>Naročnina</h2>
          {subscription.isPro ? (
            subscription.paidOverride ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <span className="badge badge-pro">Pro načrt (doživljenjski)</span>
                </div>
                <p style={{ fontSize: 14, color: "var(--muted)", margin: 0 }}>
                  Imate doživljenjski dostop do vseh Pro funkcij.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <span className="badge badge-pro">Pro načrt</span>
                </div>
                <p style={{ fontSize: 14, color: "var(--ink-soft)", margin: 0 }}>
                  Velja do:{" "}
                  <strong style={{ color: "var(--ink)" }}>
                    {formatDate(subscription.validUntil)}
                  </strong>
                </p>
                <div>
                  <a href="/cenik" className="btn btn-line btn-sm">
                    Podaljšaj
                  </a>
                </div>
              </div>
            )
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <span className="badge badge-free">Brezplačni načrt</span>
              </div>
              <p style={{ fontSize: 14, color: "var(--muted)", margin: 0 }}>
                Nadgradite na Pro za neomejene funkcije in XML izvoz.
              </p>
              <div>
                <a href="/cenik" className="btn btn-primary btn-sm">
                  Nadgradi na Pro
                </a>
              </div>
            </div>
          )}
        </section>

        {/* --- Varnost --- */}
        <section className="panel">
          <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 16 }}>Varnost</h2>
          <PasswordResetForm />
        </section>

        {/* --- Podatki --- */}
        <section className="panel">
          <h2 style={{ fontSize: 17, fontWeight: 600, marginBottom: 16 }}>Podatki</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div>
              <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 12, marginTop: 0 }}>
                Prenesite vse vaše transakcije kot JSON datoteko.
              </p>
              <a href="/api/account/export" className="btn btn-line btn-sm">
                Izvozi moje podatke
              </a>
            </div>

            <div
              style={{
                borderTop: "1px solid var(--line)",
                paddingTop: 20,
              }}
            >
              <div
                style={{
                  background: "color-mix(in srgb, var(--neg) 6%, transparent)",
                  border: "1px solid color-mix(in srgb, var(--neg) 30%, transparent)",
                  borderRadius: 10,
                  padding: 18,
                }}
              >
                <h3
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--neg)",
                    marginBottom: 8,
                    marginTop: 0,
                  }}
                >
                  Nevarno območje
                </h3>
                <p
                  style={{
                    fontSize: 13,
                    color: "var(--ink-soft)",
                    marginBottom: 14,
                    marginTop: 0,
                    lineHeight: 1.55,
                  }}
                >
                  Brisanje računa je trajno in nepovrntljivo. Izbrisani bodo vsi vaši podatki,
                  transakcije, naročnine in profil. Te operacije ni mogoče razveljaviti.
                </p>
                <DeleteAccountSection />
              </div>
            </div>
          </div>
        </section>

      </div>
    </main>
  );
}
