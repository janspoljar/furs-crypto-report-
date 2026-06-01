import Link from "next/link";
import { getUserFromServer } from "@/lib/supabase/server";
import { getUserAppProfile } from "@/lib/supabase/app-profile";
import { getAccessLevel } from "@/lib/access";

export const metadata = {
  title: "Cenik — DavkiNaDelnice.si",
  description: "Preprosto in pošteno. Brezplačni plan za začetnike, Pro za resne vlagatelje.",
};

// ── Sub-components ────────────────────────────────────────────────────────────

function PricingCard({
  name,
  price,
  period,
  features,
  notIncluded = [],
  cta,
  href,
  highlighted = false,
}: {
  name: string;
  price: string;
  period: string;
  features: string[];
  notIncluded?: string[];
  cta: string;
  href: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border-2 p-8 flex flex-col ${
        highlighted
          ? "border-blue-600 bg-blue-50 shadow-xl"
          : "border-slate-200 bg-white"
      }`}
    >
      {highlighted && (
        <div className="text-xs font-bold text-blue-700 uppercase tracking-widest mb-3">
          Priporočeno
        </div>
      )}
      <h3 className="text-xl font-bold">{name}</h3>
      <div className="mt-4 mb-6">
        <span className="text-4xl font-extrabold">{price}</span>
        <span className="text-slate-500 ml-2">/ {period}</span>
      </div>
      <ul className="space-y-3 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-slate-700">
            <span className="text-green-500 font-bold mt-0.5">✓</span>
            {f}
          </li>
        ))}
        {notIncluded.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-slate-400">
            <span className="font-bold mt-0.5">✗</span>
            {f}
          </li>
        ))}
      </ul>
      <Link
        href={href}
        className={`mt-8 block text-center py-3 rounded-xl font-bold transition-colors ${
          highlighted
            ? "bg-blue-600 hover:bg-blue-500 text-white"
            : "border-2 border-slate-300 hover:border-blue-400 text-slate-800"
        }`}
      >
        {cta}
      </Link>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <h3 className="font-semibold text-slate-900 mb-2">{q}</h3>
      <p className="text-slate-600 text-sm leading-relaxed">{a}</p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function CenikPage() {
  const { user } = await getUserFromServer();

  let isPaid = false;
  if (user) {
    const profile = await getUserAppProfile(user.id);
    const level = getAccessLevel(profile, user);
    isPaid = level === "paid" || level === "admin";
  }

  return (
    <main className="min-h-screen bg-white text-slate-900">

      {/* Hero */}
      <section className="py-20 max-w-5xl mx-auto px-6">
        <div className="text-center mb-14">
          <h1 className="text-3xl sm:text-4xl font-extrabold">Cenik</h1>
          <p className="mt-3 text-slate-500 text-lg">
            Preprosto in pošteno — za enkrat brezplačno.
          </p>
          {isPaid && (
            <p className="mt-4 inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 text-sm font-medium px-4 py-2 rounded-full">
              <span className="text-green-500">✓</span>
              Imate aktiven Pro načrt
            </p>
          )}
        </div>

        {/* Pricing cards */}
        <div className="grid sm:grid-cols-2 gap-8 max-w-3xl mx-auto">
          <PricingCard
            name="Brezplačno"
            price="0 €"
            period="za vedno"
            features={[
              "Do 200 transakcij",
              "FIFO izračun in pregled",
              "Nadzorna plošča z P&L",
              "Podpora za vse borze",
              "Navodila in vodniki",
            ]}
            notIncluded={[
              "DOH-KDVP XML izvoz",
              "DOH-DIV (dividende)",
            ]}
            cta={isPaid ? "Vaš prejšnji plan" : "Začni brezplačno"}
            href="/login"
            highlighted={false}
          />
          <PricingCard
            name="Pro"
            price="19 €"
            period="na leto"
            features={[
              "Neomejene transakcije",
              "Vsa davčna leta",
              "DOH-KDVP XML izvoz za eDavke",
              "DOH-DIV (dividende in staking)",
              "Prednostna podpora",
              "Vsi novi parserji",
            ]}
            notIncluded={[]}
            cta={isPaid ? "Že aktivirano ✓" : "Začni Pro"}
            href={isPaid ? "/reports" : "/login"}
            highlighted={!isPaid}
          />
        </div>

        <p className="text-center text-slate-400 text-xs mt-6">
          Konkurenca zaračuna €40/leto za eno davčno leto. Mi ponudimo enako za manj.
        </p>
        <p className="text-center text-slate-400 text-xs mt-2">
          Brez zavezujočih pogodb. Odpoveste kadarkoli.
        </p>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center mb-10">Pogosta vprašanja</h2>
          <div className="space-y-4">
            <FaqItem
              q="Kdaj moram prijaviti davek od prodaje delnic?"
              a="V Sloveniji moraš davčno napoved od dobička iz kapitala (obrazec DOH-KDVP) oddati do 28. februarja za preteklo davčno leto. Napoved je obvezna, če si v letu prodal katerokoli vrednostno papirje z dobičkom ali izgubo."
            />
            <FaqItem
              q="Katera metoda izračuna se zahteva v Sloveniji?"
              a="Zakon o dohodnini zahteva uporabo metode FIFO (First In, First Out) — pri prodaji se upoštevajo najstarejši nakupi. Naš sistem to avtomatsko upošteva."
            />
            <FaqItem
              q="Kako uvozim XML v eDavke?"
              a="Po prijavi na edavki.durs.si klikni na 'Dokumenti' → 'Uvoz'. Poišči svoj XML in ga naloži. eDavki samodejno prepozna tip obrazca (DOH-KDVP). Podrobna navodila najdeš v našem vodniku."
            />
            <FaqItem
              q="Kaj pa dividende?"
              a="Dividende se prijavljajo ločeno na obrazcu DOH-DIV. Naš sistem podpira izvoz tega obrazca — v Pro načrtu. Brezplačna verzija zajema samo kapitalske dobičke (nakup/prodaja)."
            />
            <FaqItem
              q="Ali upoštevate provizije borze?"
              a="Da. Provizije pri nakupu povečajo nabavno vrednost (cost basis), provizije pri prodaji pa zmanjšajo izkupiček. To je v skladu s slovenskim davčnim zakonom."
            />
          </div>
        </div>
      </section>

      {/* CTA — skrita za plačane uporabnike */}
      {!isPaid && (
        <section className="bg-blue-700 text-white py-16">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold">Pripravi si davčno napoved danes</h2>
            <p className="mt-4 text-blue-200 text-lg">Brezplačno, hitro, brez računovodja.</p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/login"
                className="bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-bold px-10 py-4 rounded-xl text-lg transition-colors shadow-lg"
              >
                Začni brezplačno →
              </Link>
              <Link
                href="/navodila"
                className="border border-white/40 hover:bg-white/10 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors"
              >
                Navodila za borze
              </Link>
            </div>
          </div>
        </section>
      )}

    </main>
  );
}
