import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 text-white">
        <div className="max-w-5xl mx-auto px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse inline-block" />
            Podprto: Binance, eToro, Coinbase, Kraken, Trading212 in več
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight">
            Kripto davki za<br />
            <span className="text-yellow-300">Slovenijo</span> — brez glavobola
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed">
            Naloži CSV iz svoje borze, mi izračunamo FIFO dobiček in pripravimo
            XML za eDavke. Pravilno, hitro, brez računovodja.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-bold px-8 py-4 rounded-xl text-lg transition-colors shadow-lg"
            >
              Začni brezplačno →
            </Link>
            <a
              href="#kako-deluje"
              className="border border-white/40 hover:bg-white/10 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors"
            >
              Kako deluje?
            </a>
          </div>
          <p className="mt-4 text-blue-200 text-sm">Brez kreditne kartice. Brezplačno do 50 transakcij.</p>
        </div>
      </section>

      {/* Social proof bar */}
      <section className="bg-slate-50 border-y border-slate-200 py-6">
        <div className="max-w-5xl mx-auto px-6 flex flex-wrap items-center justify-center gap-8 text-slate-500 text-sm font-medium">
          <span>✓ DOH-KDVP XML za eDavke</span>
          <span>✓ FIFO metoda (zakonsko zahtevana)</span>
          <span>✓ Podpora za kripto in ETF</span>
          <span>✓ Vaši podatki ostanejo vaši</span>
        </div>
      </section>

      {/* Kako deluje */}
      <section id="kako-deluje" className="py-20 max-w-5xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold">Tri koraki do eDavkov</h2>
          <p className="mt-3 text-slate-500 text-lg">Brez Excel tabel, brez ročnih izračunov.</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-8">
          <StepCard
            number="1"
            icon="📁"
            title="Naloži CSV"
            description="Prenesi transakcijsko zgodovino iz svoje borze in jo naloži v naš sistem. Podpiramo najpopularnejše borze."
          />
          <StepCard
            number="2"
            icon="⚙️"
            title="Avtomatski FIFO izračun"
            description="Naš sistem po zakonu zahtevani FIFO metodi izračuna kapitalski dobiček ali izgubo za vsako prodajo."
          />
          <StepCard
            number="3"
            icon="📄"
            title="Prenesi XML za eDavke"
            description="Generiraj DOH-KDVP XML datoteko, ki jo direktno uvozite na portal eDavki brez ročnega vnosa."
          />
        </div>
      </section>

      {/* Podprte borze */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center mb-10">Podprte borze in platforme</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { name: "Binance", icon: "🟡", note: "CSV izvoz" },
              { name: "eToro", icon: "🟢", note: "CSV izvoz" },
              { name: "Coinbase", icon: "🔵", note: "CSV izvoz" },
              { name: "Kraken", icon: "🟣", note: "CSV izvoz" },
              { name: "Trading212", icon: "🟠", note: "Kmalu" },
              { name: "Trade Republic", icon: "⚫", note: "Kmalu" },
              { name: "Revolut", icon: "🔷", note: "Kmalu" },
              { name: "Saxo", icon: "🔴", note: "Kmalu" },
            ].map((b) => (
              <div key={b.name} className="bg-white border border-slate-200 rounded-xl p-4 text-center hover:border-blue-300 transition-colors">
                <div className="text-3xl mb-2">{b.icon}</div>
                <div className="font-semibold text-slate-800">{b.name}</div>
                <div className="text-xs text-slate-500 mt-1">{b.note}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="cenik" className="py-20 max-w-5xl mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold">Cenik</h2>
          <p className="mt-3 text-slate-500 text-lg">Preprosto in pošteno.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-8 max-w-3xl mx-auto">
          <PricingCard
            name="Brezplačno"
            price="0 €"
            period="za vedno"
            features={[
              "Do 50 transakcij",
              "1 davčno leto",
              "FIFO izračun",
              "Pregled nadzorne plošče",
              "Podpora za 4 borze",
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
              "DOH-KDVP XML izvoz",
              "DOH-DIV (staking/dividende)",
              "Prednostna podpora",
              "Vsi novi parserji",
            ]}
            cta="Začni Pro"
            href="/login"
            highlighted={true}
          />
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center mb-10">Pogosta vprašanja</h2>
          <div className="space-y-4">
            <FaqItem
              q="Ali moram prijaviti kripto dobičke v Sloveniji?"
              a="Da. Po slovenskem zakonu je vsak realiziran kapitalski dobiček od prodaje kriptovalut obdavčen z 25% dohodnino. Napoved je treba oddati prek portala eDavki z obrazcem DOH-KDVP."
            />
            <FaqItem
              q="Kaj je FIFO metoda?"
              a="FIFO (First In, First Out) pomeni, da se pri prodaji upoštevajo najstarejši nakupi. Slovenska davčna zakonodaja zahteva uporabo te metode za izračun kapitalskih dobičkov."
            />
            <FaqItem
              q="Kako izvozim CSV iz borze?"
              a="Vsaka borza ima drugačen postopek. Na splošno: pojdite v zgodovino transakcij in poiščite gumb 'Izvozi' ali 'Export CSV'. Na naši strani bomo kmalu objavili navodila za vsako borzo posebej."
            />
            <FaqItem
              q="Ali so moji podatki varni?"
              a="Vaši podatki so shranjeni v varovani bazi podatkov. Ne prodajamo in ne delimo vaših finančnih podatkov s tretjimi osebami. Vse transakcije so vidne samo vam."
            />
          </div>
        </div>
      </section>

      {/* CTA footer */}
      <section className="bg-blue-700 text-white py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold">Pripravi si davčno poročilo danes</h2>
          <p className="mt-4 text-blue-200 text-lg">Brezplačno, hitro, brez računovodja.</p>
          <Link
            href="/login"
            className="inline-block mt-8 bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-bold px-10 py-4 rounded-xl text-lg transition-colors shadow-lg"
          >
            Začni brezplačno →
          </Link>
        </div>
      </section>
    </main>
  );
}

function StepCard({ number, icon, title, description }: { number: string; icon: string; title: string; description: string }) {
  return (
    <div className="relative bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-md transition-shadow">
      <div className="absolute -top-4 -left-2 w-8 h-8 bg-blue-600 text-white text-sm font-bold rounded-full flex items-center justify-center shadow">
        {number}
      </div>
      <div className="text-4xl mb-4 mt-2">{icon}</div>
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function PricingCard({
  name, price, period, features, cta, href, highlighted,
}: {
  name: string; price: string; period: string; features: string[]; cta: string; href: string; highlighted: boolean;
}) {
  return (
    <div className={`rounded-2xl border-2 p-8 flex flex-col ${highlighted ? "border-blue-600 bg-blue-50 shadow-xl" : "border-slate-200 bg-white"}`}>
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
      </ul>
      <Link
        href={href}
        className={`mt-8 block text-center py-3 rounded-xl font-bold transition-colors ${highlighted ? "bg-blue-600 hover:bg-blue-500 text-white" : "border-2 border-slate-300 hover:border-blue-400 text-slate-800"}`}
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
