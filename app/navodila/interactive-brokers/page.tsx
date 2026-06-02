import Link from "next/link";

export default function IBKRNavodilaPage() {
  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link href="/navodila" className="hover:text-blue-600">Navodila</Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">Interactive Brokers</span>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <span className="text-4xl">🔵</span>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Interactive Brokers (IBKR) — izvoz za eDavke</h1>
          <p className="text-slate-500 mt-1">Kako ustvariti Activity Report in ga uvoziti v naš sistem</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8 flex gap-3">
        <span className="text-xl">ℹ️</span>
        <div className="text-sm text-blue-800">
          <strong>Opomba:</strong> IBKR ima napreden sistem poročil. Priporočamo uporabo <strong>Flex Query</strong> za natančen izvoz. Postopek traja ~5 minut.
        </div>
      </div>

      <StepSection number="1" title="Dostop do IBKR poročil">
        <ol className="space-y-3">
          <Step n="1.1" text="Prijavi se na interactivebrokers.com" />
          <Step n="1.2" text='V Client Portal klikni na "Performance & Reports"' />
          <Step n="1.3" text='Izberi "Flex Queries"' />
        </ol>
      </StepSection>

      <StepSection number="2" title="Ustvari Flex Query za Activity Report">
        <ol className="space-y-4">
          <Step n="2.1" text='Klikni "+" ali "Create Flex Query"' />
          <Step n="2.2" text='Izberi "Activity Flex Query"' />
          <Step n="2.3" text="Poimenuj poizvedbo npr. 'DOH-KDVP izvoz'" />
          <Step n="2.4" text='Pod "Sections" aktiviraj "Trades"' />
          <Step n="2.5" text='Pod "Delivery Configuration" izberi "CSV"' />
          <Step n="2.6" text='Nastavi "Date Period" na celotno davčno leto (npr. 2024-01-01 do 2024-12-31)' />
          <Step n="2.7" text='Klikni "Save"' />
          <Step n="2.8" text='Nato klikni "Run" in prenesi CSV datoteko' />
        </ol>
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          <strong>Alternativa:</strong> Pojdi na Reports → Activity Reports → Custom Report in nastavi datum + CSV format.
        </div>
      </StepSection>

      <StepSection number="3" title="Uvozi CSV v naš sistem">
        <ol className="space-y-3">
          <Step n="3.1" text='Pojdi na stran "Uvoz CSV"' />
          <Step n="3.2" text='Izberi borzo "Interactive Brokers"' />
          <Step n="3.3" text="Povleci in spusti CSV datoteko" />
          <Step n="3.4" text='Klikni "Uvozi iz Interactive Brokers"' />
        </ol>
      </StepSection>

      <StepSection number="4" title="Prenesi XML za eDavke">
        <ol className="space-y-3">
          <Step n="4.1" text="V nadzorni plošči preveri uvožene transakcije" />
          <Step n="4.2" text='Pojdi na "Poročila" in izberi davčno leto' />
          <Step n="4.3" text="Prenesi DOH-KDVP XML" />
        </ol>
        <div className="mt-4">
          <Link href="/navodila/uvoz-edavki" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-500 text-sm font-medium">
            Naslednji korak: Kako uvoziti XML na eDavke →
          </Link>
        </div>
      </StepSection>

      <section className="mt-8 p-6 bg-slate-50 border border-slate-200 rounded-xl">
        <h3 className="font-bold text-slate-800 mb-4">Pogosta vprašanja za IBKR</h3>
        <div className="space-y-4">
          <FaqItem q="IBKR ima IBRK Lite in Pro — ali je razlika?" a="Ne za namen davčnega poročanja. Oba načina imata dostop do enakih poročil." />
          <FaqItem q="Imam opcije in futures — ali so vključeni?" a="Naš sistem trenutno podpira nakup/prodajo delnic in ETF. Opcije in futures zahtevajo poseben obrazec (D-IFI). Za to se posvetuj z davčnim svetovalcem." />
          <FaqItem q="IBKR poroča v USD — bo pretvorba pravilna?" a="Da. Sistem pretvori vse vrednosti v EUR po tečaju ECB na dan transakcije." />
        </div>
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/upload" className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors">
          Uvozi IBKR CSV →
        </Link>
        <Link href="/navodila/uvoz-edavki" className="border border-slate-300 hover:border-blue-400 text-slate-700 font-semibold px-6 py-3 rounded-xl text-sm transition-colors">
          Navodila za uvoz na eDavke
        </Link>
      </div>
    </div>
  );
}

function StepSection({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center shrink-0">{number}</div>
        <h2 className="text-xl font-bold text-slate-800">{title}</h2>
      </div>
      <div className="ml-11">{children}</div>
    </section>
  );
}

function Step({ n, text }: { n: string; text: string }) {
  return (
    <li className="flex gap-3 text-sm text-slate-700">
      <span className="text-blue-400 font-mono shrink-0 w-8">{n}</span>
      {text}
    </li>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <div>
      <p className="font-semibold text-slate-700 text-sm">{q}</p>
      <p className="text-slate-500 text-sm mt-1">{a}</p>
    </div>
  );
}
