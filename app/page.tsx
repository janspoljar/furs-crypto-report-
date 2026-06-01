import Link from "next/link";
import { getUserFromServer } from "@/lib/supabase/server";
import { getUserAppProfile } from "@/lib/supabase/app-profile";
import { getAccessLevel, type AccessLevel } from "@/lib/access";

type AuthUser = { id: string; email?: string | null };

// Server component. Renders one of three homepage variants based on access level.
export default async function HomePage() {
  const { user } = await getUserFromServer();

  if (!user) return <GuestHomepage />;

  const profile = await getUserAppProfile(user.id);
  const level   = getAccessLevel(profile, user);
  const authUser: AuthUser = { id: user.id, email: user.email };

  if (level === "free") return <FreeHomepage user={authUser} />;
  return <PaidHomepage user={authUser} level={level} />;
}

// ── Guest Homepage ────────────────────────────────────────────────────────────
// Public marketing page. Shown to unauthenticated visitors.

function GuestHomepage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 text-white">
        <div className="max-w-5xl mx-auto px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />
            Podprto: Trading212, eToro, Revolut, Interactive Brokers in več
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight">
            Napoved davka na delnice<br />
            <span className="text-yellow-300">brez glavobola</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed">
            Naloži CSV iz svoje borze — mi izračunamo dobiček po FIFO metodi in
            pripravimo <strong className="text-white">DOH-KDVP XML</strong> za uvoz na eDavke.
            Pravilno, hitro, brez računovodja.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-bold px-8 py-4 rounded-xl text-lg transition-colors shadow-lg"
            >
              Začni brezplačno →
            </Link>
            <Link
              href="/navodila"
              className="border border-white/40 hover:bg-white/10 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors"
            >
              Navodila
            </Link>
          </div>
          <p className="mt-4 text-blue-200 text-sm">Brez kreditne kartice. Brezplačno v beta fazi.</p>
        </div>
      </section>

      {/* Social proof bar */}
      <section className="bg-slate-50 border-y border-slate-200 py-5">
        <div className="max-w-5xl mx-auto px-6 flex flex-wrap items-center justify-center gap-6 text-slate-600 text-sm font-medium">
          <span>✓ DOH-KDVP XML za eDavke</span>
          <span>✓ FIFO metoda (zakonsko zahtevana)</span>
          <span>✓ Delnice, ETF in dividende</span>
          <span>✓ Vaši podatki ostanejo vaši</span>
          <span>✓ Slovensko davčno pravo</span>
        </div>
      </section>

      {/* Kako deluje */}
      <section className="py-20 max-w-5xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold">Štiri koraki do oddane napovedi</h2>
          <p className="mt-3 text-slate-500 text-lg">Brez Excel tabel, brez ročnih izračunov, brez napak.</p>
        </div>
        <div className="grid sm:grid-cols-4 gap-6">
          <StepCard number="1" icon="📁" title="Izvozi iz borze"    description="Prenesi CSV iz Trading212, eToro, Revolut ali IBKR. Naša navodila ti pokažejo točno kako." />
          <StepCard number="2" icon="⬆️" title="Naloži v sistem"   description="Datoteko povleci in spusti. Sistem samodejno prepozna format in uvozi transakcije." />
          <StepCard number="3" icon="⚙️" title="Avtomatski izračun" description="FIFO metoda izračuna kapitalski dobiček ali izgubo za vsako prodano pozicijo." />
          <StepCard number="4" icon="📄" title="Prenesi XML"        description="Generirani DOH-KDVP XML uvozi direktno na eDavke — brez ročnega vnosa podatkov." />
        </div>
        <div className="mt-10 text-center">
          <Link href="/navodila" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-500 font-semibold">
            Poglej podrobna navodila po borzah →
          </Link>
        </div>
      </section>

      {/* Podprte borze */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center mb-3">Podprte borze in platforme</h2>
          <p className="text-center text-slate-500 mb-10 text-sm">Za vsako borzo imamo podrobna navodila kako priti do CSV datoteke.</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { name: "eToro",                icon: "🟢", status: "Podprto",  href: "/navodila/etoro" },
              { name: "Trading212",           icon: "🟠", status: "Podprto",  href: "/navodila/trading212" },
              { name: "Revolut",              icon: "🔷", status: "Podprto",  href: "/navodila/revolut" },
              { name: "Interactive Brokers",  icon: "🔵", status: "Podprto",  href: "/navodila/interactive-brokers" },
              { name: "Trade Republic",       icon: "⚫", status: "Kmalu",    href: "/navodila" },
              { name: "Saxo Bank",            icon: "🔴", status: "Kmalu",    href: "/navodila" },
              { name: "Plus500",              icon: "🟡", status: "Kmalu",    href: "/navodila" },
              { name: "Druga platforma",      icon: "📄", status: "Po meri",  href: "/navodila" },
            ].map((b) => (
              <Link
                key={b.name}
                href={b.href}
                className={`flex flex-col items-center p-4 rounded-xl border-2 text-center hover:shadow-md transition-all no-underline ${
                  b.status === "Podprto"
                    ? "border-green-200 bg-white hover:border-green-400"
                    : "border-slate-200 bg-white opacity-75 hover:border-slate-300"
                }`}
              >
                <div className="text-3xl mb-2">{b.icon}</div>
                <div className="font-semibold text-slate-800 text-sm">{b.name}</div>
                <div className={`text-xs mt-1 font-medium ${b.status === "Podprto" ? "text-green-600" : "text-slate-400"}`}>
                  {b.status}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Cenik */}
      <section id="cenik" className="py-20 max-w-5xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold">Cenik</h2>
          <p className="mt-3 text-slate-500 text-lg">Preprosto in pošteno — za enkrat brezplačno.</p>
        </div>
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
            cta="Začni brezplačno"
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
            cta="Začni Pro"
            href="/login"
            highlighted={true}
          />
        </div>
        <p className="text-center text-slate-400 text-xs mt-6">
          Konkurenca zaračuna €40/leto za eno davčno leto. Mi ponudimo enako za manj.
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

      {/* CTA footer */}
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

    </main>
  );
}

// ── Free Homepage ─────────────────────────────────────────────────────────────
// Workspace hub for logged-in free users.

function FreeHomepage({ user }: { user: AuthUser }) {
  return (
    <main className="max-w-4xl mx-auto px-4 py-10">

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-1">
          <h1 className="text-2xl font-bold text-slate-900">Dobrodošli</h1>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
              Brezplačni načrt
            </span>
            <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
              Beta · vse funkcije odprte
            </span>
          </div>
        </div>
        <p className="text-slate-500 text-sm">{user.email}</p>
        <p className="mt-3 text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
          Aplikacija je v beta fazi — vse funkcije so trenutno brezplačno na voljo vsem uporabnikom.
        </p>
      </div>

      <QuickActions />

      <OnboardingChecklist />

    </main>
  );
}

// ── Paid / Admin Homepage ─────────────────────────────────────────────────────
// Workspace hub for paid users and admins.

function PaidHomepage({ user, level }: { user: AuthUser; level: AccessLevel }) {
  const isAdminUser = level === "admin";

  return (
    <main className="max-w-4xl mx-auto px-4 py-10">

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-1">
          <h1 className="text-2xl font-bold text-slate-900">Dobrodošli</h1>
          <span
            className={`text-xs font-semibold px-3 py-1 rounded-full border ${
              isAdminUser
                ? "text-purple-700 bg-purple-50 border-purple-200"
                : "text-green-700 bg-green-50 border-green-200"
            }`}
          >
            {isAdminUser ? "Administrator" : "Plačani načrt"}
          </span>
        </div>
        <p className="text-slate-500 text-sm">{user.email}</p>
        {isAdminUser && (
          <div className="mt-3 flex items-center gap-2 text-sm text-purple-800 bg-purple-50 border border-purple-200 rounded-lg px-4 py-3">
            <span>Administratorski dostop je aktiven.</span>
            <a href="/admin" className="font-semibold underline hover:text-purple-900 ml-1">
              Odpri administracijo →
            </a>
          </div>
        )}
      </div>

      <QuickActions />

      {/* Premium section */}
      <div className="mb-6">
        <h2 className="text-base font-semibold text-slate-700 mb-3">Napredna orodja</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { href: "/reports", icon: "📊", label: "Napredna poročila",  desc: "Podrobna analiza po davčnih letih" },
            { href: "/reports", icon: "📤", label: "Množični XML izvoz", desc: "Izvozi za več davčnih let hkrati" },
          ].map((a) => (
            <a
              key={a.label}
              href={a.href}
              className="flex items-center gap-3 p-4 bg-white border border-green-200 rounded-xl hover:border-green-400 hover:shadow-sm transition-all no-underline"
            >
              <span className="text-2xl shrink-0">{a.icon}</span>
              <div>
                <span className="font-semibold text-slate-800 text-sm">{a.label}</span>
                <p className="text-xs text-slate-500 mt-0.5">{a.desc}</p>
              </div>
            </a>
          ))}
        </div>
      </div>

      <OnboardingChecklist />

    </main>
  );
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function QuickActions() {
  return (
    <div className="mb-6">
      <h2 className="text-base font-semibold text-slate-700 mb-3">Hitri dostop</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: "/upload",       icon: "⬆️", label: "Uvoz CSV",    desc: "Naloži transakcije" },
          { href: "/transactions", icon: "📋", label: "Transakcije", desc: "Pregled in filter" },
          { href: "/reports",      icon: "📄", label: "Poročila",    desc: "DOH-KDVP izvoz" },
          { href: "/profile",      icon: "👤", label: "Profil",      desc: "Davčni podatki" },
        ].map((a) => (
          <a
            key={a.href}
            href={a.href}
            className="flex flex-col items-center gap-2 p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all text-center no-underline"
          >
            <span className="text-2xl">{a.icon}</span>
            <span className="font-semibold text-slate-800 text-sm">{a.label}</span>
            <span className="text-xs text-slate-400">{a.desc}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

function OnboardingChecklist() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <h2 className="font-semibold text-slate-800 mb-4">Začetek — 4 koraki</h2>
      <ol className="space-y-3">
        {[
          { n: "1", label: "Izpolni davčni profil",   href: "/profile",      desc: "Davčna številka in naslov za XML izvoz" },
          { n: "2", label: "Naloži CSV datoteko",      href: "/upload",       desc: "Iz Trading212, eToro, Revolut ali IBKR" },
          { n: "3", label: "Preveri transakcije",      href: "/transactions", desc: "Potrdi da so vsi uvozi pravilni" },
          { n: "4", label: "Generiraj poročilo",       href: "/reports",      desc: "Prenesi DOH-KDVP XML za eDavke" },
        ].map((s) => (
          <li key={s.n}>
            <a href={s.href} className="flex items-start gap-3 group no-underline">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                {s.n}
              </span>
              <div>
                <span className="font-medium text-slate-800 group-hover:text-blue-700 text-sm transition-colors">
                  {s.label}
                </span>
                <p className="text-xs text-slate-400 mt-0.5">{s.desc}</p>
              </div>
            </a>
          </li>
        ))}
      </ol>
    </div>
  );
}

// ── Guest-only sub-components ─────────────────────────────────────────────────

function StepCard({ number, icon, title, description }: {
  number: string; icon: string; title: string; description: string;
}) {
  return (
    <div className="relative bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-md transition-shadow">
      <div className="absolute -top-4 -left-2 w-8 h-8 bg-blue-600 text-white text-sm font-bold rounded-full flex items-center justify-center shadow">
        {number}
      </div>
      <div className="text-4xl mb-4 mt-2">{icon}</div>
      <h3 className="text-base font-bold mb-2">{title}</h3>
      <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function PricingCard({ name, price, period, features, notIncluded, cta, href, highlighted }: {
  name: string; price: string; period: string; features: string[];
  notIncluded: string[]; cta: string; href: string; highlighted: boolean;
}) {
  return (
    <div className={`rounded-2xl border-2 p-8 flex flex-col ${
      highlighted ? "border-blue-600 bg-blue-50 shadow-xl" : "border-slate-200 bg-white"
    }`}>
      {highlighted && (
        <div className="text-xs font-bold text-blue-700 uppercase tracking-widest mb-3">Priporočeno</div>
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
