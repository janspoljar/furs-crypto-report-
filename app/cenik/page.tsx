import type { Metadata } from "next";
import { getUserFromServer } from "@/lib/supabase/server";
import { getSubscription } from "@/lib/subscription";
import CheckoutButton from "./checkout-button";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Cenik — Pro načrt za FURS XML | DavkiNaDelnicah.si",
  description:
    "Pro načrt za 19 € letno: neomejene transakcije, DOH-KDVP in DOH-DIV XML za eDavki, pretekla davčna leta. Brez samodejne obnove.",
  path: "/cenik",
  shortDescription:
    "19 € letno: DOH-KDVP in DOH-DIV XML za eDavki, neomejene transakcije, pretekla leta. Brez samodejne obnove.",
  ogImageAlt: "DavkiNaDelnicah.si — Cenik",
});

const CENIK_FAQS = [
  { q: "Ali se naročnina obnovi samodejno?", a: "Ne. Pro velja 12 mesecev po plačilu in se ne obnovi samodejno. Po izteku te bomo opomnili — sam se odločiš, ali plačaš naslednje leto." },
  { q: "Ali lahko dobim račun za pravno osebo?", a: "Da. Pri plačilu lahko vneseš podatke podjetja (naziv, naslov, davčno številko) — račun prejmeš avtomatsko po e-pošti." },
  { q: "Kaj se zgodi z mojimi podatki, če odpovem Pro?", a: "Tvoja že generirana poročila in zgodovina ostanejo dostopni. Naloženi izpiski za prihodnja leta bodo padli pod omejitev 200 transakcij brezplačnega načrta." },
  { q: "Ponujate vračilo, če mi izračun ne ustreza?", a: "Da, 30-dnevno polno vračilo brez vprašanj. Piši na podpora@davkinadelnicah.si in vrnemo plačilo." },
  { q: "Ali Pro vključuje davčno svetovanje?", a: "Ne. Pro je naročnina na orodje za izračun in pripravo XML datoteke. Za individualno davčno svetovanje priporočamo davčnega svetovalca." },
];

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--pos)" strokeWidth="2.4" strokeLinecap="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--muted-2)" strokeWidth="2" strokeLinecap="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

interface CenikPageProps {
  searchParams: Promise<{ success?: string }>;
}

export default async function CenikPage({ searchParams }: CenikPageProps) {
  const params = await searchParams;
  const showSuccess = params.success === "1";

  const { user } = await getUserFromServer();
  const subscription = user ? await getSubscription(user.id) : null;
  const isPro = subscription?.isPro ?? false;
  const validUntil = subscription?.validUntil ?? null;

  return (
    <main>
      <section className="section">
        <div className="wrap">

          {/* Success banner after Stripe checkout */}
          {showSuccess && (
            <div className="banner-success" style={{ marginBottom: 32 }}>
              <div>
                <strong>Uspešno aktivirano ✓</strong>
                <p>Pro načrt je aktiven. Zdaj imate dostop do neomejenih transakcij in XML izvoza.</p>
              </div>
              <a href="/reports" className="btn btn-primary btn-sm">Pojdi na poročila →</a>
            </div>
          )}

          <div className="pricing-head reveal">
            <span className="eyebrow" style={{ justifyContent: "center" }}>Cenik</span>
            <h1 className="h-1">Pošteno. Letno. Brez naročnine.</h1>
            <p>Plačaš 19 € za eno davčno leto. Brez samodejne obnove, brez skritih stroškov.</p>
          </div>

          <div className="compare-grid">
            {/* Free column */}
            <div className="compare-col reveal">
              <div className="head">
                <h3>Brezplačno</h3>
                <span className="price">0&nbsp;€</span>
              </div>
              <p className="muted" style={{ fontSize: 14 }}>Za preverjanje stanja in pregled portfelja.</p>
              <ul>
                <li><CheckIcon /> Do 200 transakcij</li>
                <li><CheckIcon /> Samodejno prepoznavanje posrednika</li>
                <li><CheckIcon /> Pregled dobička in izgube</li>
                <li><CheckIcon /> Predogled razčlenitve po FIFO</li>
                <li className="no"><XIcon /> Doh-KDVP XML izvoz</li>
                <li className="no"><XIcon /> Doh-Div poročilo</li>
                <li className="no"><XIcon /> Pretekla davčna leta (pred 2024)</li>
              </ul>
              <button className="btn btn-line cta" disabled>
                {isPro ? "Brezplačni načrt" : "Trenutni načrt"}
              </button>
            </div>

            {/* Pro column */}
            <div className="compare-col pro reveal d1">
              <span className="ribbon">Priporočeno</span>
              <div className="head">
                <h3>Pro</h3>
                <span className="price">19&nbsp;€<small>/davčno leto</small></span>
              </div>
              {/* ⚠️ ZAMENJAJ: Če si DDV zavezanec → "Cena vključuje 22 % DDV"
                             Če si mali davčni zavezanec → obdrži spodnjo vrstico */}
              <p style={{ fontSize: 12, color: "var(--muted)", margin: "-4px 0 10px", lineHeight: 1.4 }}>
                DDV ni obračunan (mali davčni zavezanec po 94. členu ZDDV-1)
              </p>
              <p className="muted" style={{ fontSize: 14 }}>Vse, kar potrebuješ za oddajo napovedi v eDavki.</p>
              <ul>
                <li><CheckIcon /> <strong>Neomejeno</strong> transakcij</li>
                <li><CheckIcon /> Doh-KDVP XML za neposreden uvoz v eDavki</li>
                <li><CheckIcon /> Doh-Div poročilo za dividende</li>
                <li><CheckIcon /> Pretekla davčna leta (do 5 let nazaj)</li>
                <li><CheckIcon /> Razčlenitev po FIFO z izvirnimi nakupi</li>
                <li><CheckIcon /> E-poštna podpora v 24 urah</li>
                <li><CheckIcon /> Brez samodejne obnove naročnine</li>
              </ul>

              {isPro ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <button className="btn btn-primary cta" disabled style={{ opacity: 0.7 }}>
                    ✓ Že aktivirano
                  </button>
                  {validUntil && (
                    <p style={{ fontSize: 13, color: "var(--pos)", textAlign: "center", margin: 0, fontWeight: 600 }}>
                      Veljavno do {validUntil.toLocaleDateString("sl-SI", { day: "2-digit", month: "long", year: "numeric" })}
                    </p>
                  )}
                </div>
              ) : (
                <CheckoutButton />
              )}
            </div>
          </div>

          <p className="text-center muted" style={{ marginTop: 24, fontSize: 13.5 }}>
            Plačilo prek Stripe · SEPA, kreditna kartica · 30-dnevna garancija vračila
          </p>
          {/* ⚠️ ZAMENJAJ: Podatki o ponudniku storitve (ZVPot-1 čl. 43) */}
          <p className="text-center" style={{ marginTop: 10, fontSize: 11.5, color: "var(--muted-2)", lineHeight: 1.8 }}>
            Ponudnik: <strong style={{ color: "var(--muted)" }}>⚠️ [IME PODJETJA ali S.P.]</strong> ·
            {" "}⚠️ [NASLOV], Slovenija ·
            {" "}Mat. št.: ⚠️ [MATICNA] ·
            {" "}ID za DDV: ⚠️ SI[DDVSTEVILKA] ali ni zavezanec
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="text-center reveal" style={{ maxWidth: "36em", margin: "0 auto 36px" }}>
            <span className="eyebrow" style={{ justifyContent: "center" }}>FAQ</span>
            <h2 className="h-1" style={{ marginTop: 18 }}>Vprašanja o ceniku</h2>
          </div>
          <div className="faq-list">
            {CENIK_FAQS.map((item, i) => (
              <div className="faq-item reveal" key={i}>
                <button className="faq-q">
                  {item.q}
                  <span className="pm">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </span>
                </button>
                <div className="faq-a">
                  <div className="inner">{item.a}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Internal link to navodila */}
      <section className="section" style={{ paddingTop: 0, paddingBottom: 64 }}>
        <div className="wrap">
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexWrap: "wrap", gap: 16,
            background: "var(--surface)", border: "1px solid var(--line)",
            borderRadius: "var(--r-lg)", padding: "20px 24px",
          }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>Prvič uvažate CSV?</div>
              <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>
                Oglejte si navodila za izvoz iz Trading 212, Revolut, IBKR in ostalih posrednikov.
              </p>
            </div>
            <a href="/navodila" className="btn btn-line btn-sm" style={{ flexShrink: 0 }}>
              Navodila za uvoz CSV →
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
