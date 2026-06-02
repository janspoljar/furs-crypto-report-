import Link from "next/link";

export default function RevolutNavodilaPage() {
  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link href="/navodila" className="hover:text-blue-600">Navodila</Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">Revolut</span>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <span className="text-4xl">🔷</span>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Revolut — izvoz za eDavke</h1>
          <p className="text-slate-500 mt-1">Kako izvoziti izpisek iz Revolut Trading in ga uvoziti v naš sistem</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8 flex gap-3">
        <span className="text-xl">ℹ️</span>
        <div className="text-sm text-blue-800">
          <strong>Opomba:</strong> Izvozi iz razdelka <strong>Stocks</strong> (ne iz glavnega bančnega računa). Revolut Trading je ločen del aplikacije.
        </div>
      </div>

      <StepSection number="1" title="Izvozi iz Revolut aplikacije">
        <ol className="space-y-4">
          <Step n="1.1" text="Odpri Revolut aplikacijo na telefonu" />
          <Step n="1.2" text='Pojdi v razdelek "Stocks" ali "Investing"' />
          <Step n="1.3" text='Klikni na ikono profila ali nastavitev (⚙️) zgoraj desno' />
          <Step n="1.4" text='Izberi "Statements"' />
          <Step n="1.5" text='Izberi "Trading account statements"' />
          <Step n="1.6" text="Nastavi datum od 1.1. do 31.12. davčnega leta" />
          <Step n="1.7" text='Izberi format "CSV"' />
          <Step n="1.8" text="CSV bo poslan na tvoj email naslov" />
        </ol>
      </StepSection>

      <StepSection number="1b" title="Alternativno: izvoz prek spletne strani">
        <ol className="space-y-3">
          <Step n="1.1" text="Odpri app.revolut.com v brskalniku" />
          <Step n="1.2" text='Pojdi na "Stocks" ali "Investing"' />
          <Step n="1.3" text='V nastavitvah ali profilni strani poišči "Statements"' />
          <Step n="1.4" text="Nastavi datumski obseg in prenesi CSV" />
        </ol>
        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          <strong>Namig:</strong> Revolut aplikacija je primarni način za izvoz. Spletna različica je odvisna od verzije aplikacije.
        </div>
      </StepSection>

      <StepSection number="2" title="Uvozi CSV v naš sistem">
        <ol className="space-y-3">
          <Step n="2.1" text='Pojdi na stran "Uvoz CSV"' />
          <Step n="2.2" text='Izberi borzo "Revolut"' />
          <Step n="2.3" text="Povleci in spusti CSV datoteko" />
          <Step n="2.4" text='Klikni "Uvozi iz Revolut"' />
        </ol>
      </StepSection>

      <StepSection number="3" title="Preveri in prenesi XML">
        <ol className="space-y-3">
          <Step n="3.1" text="V nadzorni plošči preveri uvožene transakcije" />
          <Step n="3.2" text='Pojdi na "Poročila" in izberi davčno leto' />
          <Step n="3.3" text="Prenesi DOH-KDVP XML" />
        </ol>
        <div className="mt-4">
          <Link href="/navodila/uvoz-edavki" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-500 text-sm font-medium">
            Naslednji korak: Kako uvoziti XML na eDavke →
          </Link>
        </div>
      </StepSection>

      <section className="mt-8 p-6 bg-slate-50 border border-slate-200 rounded-xl">
        <h3 className="font-bold text-slate-800 mb-4">Pogosta vprašanja za Revolut</h3>
        <div className="space-y-4">
          <FaqItem q="Revolut mi pošlje izpisek v USD — je to problem?" a="Ne. Naš sistem avtomatsko pretvori v EUR po tečaju ECB na dan transakcije." />
          <FaqItem q="Ali moram ločeno uvoziti vsako davčno leto?" a="Priporočamo ločen uvoz po letih za lažji pregled. Sistem to podpira." />
          <FaqItem q="Ne najdem razdelka Stocks v aplikaciji." a="Revolut Stocks je na voljo samo za Standard, Plus, Premium in Metal račune. Preverite, da imate aktiviran Trading račun." />
        </div>
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/upload" className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors">
          Uvozi Revolut CSV →
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
