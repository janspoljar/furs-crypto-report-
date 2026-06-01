import Link from "next/link";

export default function Trading212NavodilaPage() {
  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link href="/navodila" className="hover:text-blue-600">Navodila</Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">Trading212</span>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <span className="text-4xl">🟠</span>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Trading212 — izvoz za eDavke</h1>
          <p className="text-slate-500 mt-1">Kako prenesti Trade History CSV in ga uvoziti v naš sistem</p>
        </div>
      </div>

      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-8 flex gap-3">
        <span className="text-xl">ℹ️</span>
        <div className="text-sm text-orange-800">
          <strong>Opomba:</strong> Izvozi samo iz računa <strong>Invest</strong> (ne CFD). CFD transakcije niso vključene v DOH-KDVP obrazec.
        </div>
      </div>

      {/* KORAK 1 — Spletna stran */}
      <StepSection number="1" title="Izvozi iz spletne strani Trading212">
        <ol className="space-y-4">
          <Step n="1.1" text="Prijavi se na trading212.com" />
          <Step n="1.2" text='Klikni na ikono "History" (ura) v levem meniju' />
          <Step n="1.3" text='Zgoraj desno klikni na gumb "Export" (ikona prenosa)' />
          <Step n="1.4" text='Izberi "Trade History"' />
          <Step n="1.5" text='Nastavi datum: od 1.1. do 31.12. davčnega leta (ali "All time" za vse)' />
          <Step n="1.6" text='Klikni "Export to CSV"' />
          <Step n="1.7" text="Datoteka se prenese direktno v brskalnik" />
        </ol>
      </StepSection>

      {/* KORAK 1b — Mobilna aplikacija */}
      <StepSection number="1b" title="Alternativno: izvoz iz mobilne aplikacije">
        <ol className="space-y-3">
          <Step n="1.1" text="Odpri Trading212 aplikacijo na telefonu" />
          <Step n="1.2" text='Klikni na "Profile" (ikona osebe) spodaj desno' />
          <Step n="1.3" text='Izberi "History"' />
          <Step n="1.4" text='Klikni na ikono "..." ali "Export" zgoraj desno' />
          <Step n="1.5" text='Izberi "Export" in nastavi datumski obseg' />
          <Step n="1.6" text="CSV bo poslan na tvoj email naslov" />
        </ol>
      </StepSection>

      {/* KORAK 2 */}
      <StepSection number="2" title="Uvozi CSV v naš sistem">
        <ol className="space-y-3">
          <Step n="2.1" text='Pojdi na stran "Uvoz CSV"' />
          <Step n="2.2" text='Izberi borzo "Trading212"' />
          <Step n="2.3" text="Povleci in spusti CSV datoteko ali klikni in jo izberi" />
          <Step n="2.4" text='Klikni "Uvozi iz Trading212"' />
          <Step n="2.5" text="Sistem bo samodejno razpoznal format in uvozil transakcije" />
        </ol>
      </StepSection>

      {/* KORAK 3 */}
      <StepSection number="3" title="Preveri in prenesi XML">
        <ol className="space-y-3">
          <Step n="3.1" text='V nadzorni plošči preveri število uvoženih transakcij' />
          <Step n="3.2" text='Pojdi na "Poročila" in izberi davčno leto' />
          <Step n="3.3" text='Klikni "Izvozi DOH-KDVP XML"' />
        </ol>
        <div className="mt-4">
          <Link href="/navodila/uvoz-edavki" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-500 text-sm font-medium">
            Naslednji korak: Kako uvoziti XML na eDavke →
          </Link>
        </div>
      </StepSection>

      <section className="mt-8 p-6 bg-slate-50 border border-slate-200 rounded-xl">
        <h3 className="font-bold text-slate-800 mb-4">Pogosta vprašanja za Trading212</h3>
        <div className="space-y-4">
          <FaqItem q='Kakšen je format datoteke?' a='Trading212 izvozi standardni CSV z naslednjimi stolpci: Action, Time, ISIN, Ticker, Name, Shares, Price/Share, Currency, Exchange Rate, Result, Total, Notes. Naš sistem to samodejno prepozna.' />
          <FaqItem q="Imam račun Invest in CFD — katerega izvozim?" a="Samo Invest račun. CFD transakcije niso del DOH-KDVP napovedi in se obravnavajo drugače." />
          <FaqItem q="Ali moram uvoziti prejšnja leta posebej?" a="Ja — uvozi CSV za vsako davčno leto posebej ali enega velikega z vsemi podatki. Naš sistem bo sortiral po letu." />
          <FaqItem q="Transakcije so v GBP/USD — bo to prav?" a="Da. Sistem pri uvozu samodejno pretvori v EUR po tečaju ECB na dan transakcije." />
        </div>
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/upload" className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors">
          Uvozi Trading212 CSV →
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
