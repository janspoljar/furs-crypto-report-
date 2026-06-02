import Link from "next/link";

export default function N26NavodilaPage() {
  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link href="/navodila" className="hover:text-blue-600">Navodila</Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">N26</span>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <span className="text-4xl">🟤</span>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">N26 — izvoz za eDavke</h1>
          <p className="text-slate-500 mt-1">Kako prenesti transakcijsko zgodovino iz N26 in jo uvoziti v naš sistem</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8 flex gap-3">
        <span className="text-xl">ℹ️</span>
        <div className="text-sm text-blue-800">
          <strong>N26 Stocks:</strong> N26 ponuja naložbene račune (N26 Stocks/ETF) v izbranih državah.
          Uvozi izvoz iz svojega naložbenega računa, <strong>ne</strong> iz bančnega računa.
        </div>
      </div>

      <StepSection number="1" title="Izvozi iz N26 aplikacije">
        <ol className="space-y-4">
          <li className="flex gap-3 text-sm text-slate-700"><span className="text-blue-400 font-mono shrink-0 w-8">1.1</span>Odpri N26 aplikacijo in pojdi na <strong>Naložbe</strong> (Investments)</li>
          <li className="flex gap-3 text-sm text-slate-700"><span className="text-blue-400 font-mono shrink-0 w-8">1.2</span>Klikni na <strong>Nastavitve</strong> (⚙️) ali <strong>Dokumenti</strong></li>
          <li className="flex gap-3 text-sm text-slate-700"><span className="text-blue-400 font-mono shrink-0 w-8">1.3</span>Poišči <strong>Izpisi transakcij</strong> ali <strong>Letno poročilo</strong></li>
          <li className="flex gap-3 text-sm text-slate-700"><span className="text-blue-400 font-mono shrink-0 w-8">1.4</span>Nastavi datum od 1.1. do 31.12. davčnega leta</li>
          <li className="flex gap-3 text-sm text-slate-700"><span className="text-blue-400 font-mono shrink-0 w-8">1.5</span>Prenesi CSV ali Excel datoteko</li>
        </ol>
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          <strong>Opomba:</strong> N26 Stocks je dostopen samo v nekaterih državah. Če možnosti za izvoz ne najdeš, preverite ali je funkcija na voljo v vaši regiji.
        </div>
      </StepSection>

      <StepSection number="2" title="Uvozi v naš sistem">
        <ol className="space-y-3">
          <li className="flex gap-3 text-sm text-slate-700"><span className="text-blue-400 font-mono shrink-0 w-8">2.1</span>Pojdi na stran &quot;Uvoz CSV&quot;</li>
          <li className="flex gap-3 text-sm text-slate-700"><span className="text-blue-400 font-mono shrink-0 w-8">2.2</span>Povleci in spusti CSV datoteko — sistem bo samodejno prepoznal N26 format</li>
          <li className="flex gap-3 text-sm text-slate-700"><span className="text-blue-400 font-mono shrink-0 w-8">2.3</span>Preveri prepoznano borzo in klikni &quot;Uvozi iz N26&quot;</li>
        </ol>
      </StepSection>

      <StepSection number="3" title="Prenesi XML za eDavke">
        <ol className="space-y-3">
          <li className="flex gap-3 text-sm text-slate-700"><span className="text-blue-400 font-mono shrink-0 w-8">3.1</span>Pojdi na &quot;Poročila&quot; in izberi davčno leto</li>
          <li className="flex gap-3 text-sm text-slate-700"><span className="text-blue-400 font-mono shrink-0 w-8">3.2</span>Prenesi DOH-KDVP XML</li>
        </ol>
        <div className="mt-4">
          <Link href="/navodila/uvoz-edavki" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-500 text-sm font-medium">
            Naslednji korak: Kako uvoziti XML na eDavke →
          </Link>
        </div>
      </StepSection>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/upload" className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors">
          Uvozi N26 CSV →
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
