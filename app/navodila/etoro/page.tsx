import Link from "next/link";

export default function EtoroNavodilaPage() {
  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link href="/navodila" className="hover:text-blue-600">Navodila</Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">eToro</span>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <span className="text-4xl">🟢</span>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">eToro — izvoz za eDavke</h1>
          <p className="text-slate-500 mt-1">Kako prenesti transakcijsko zgodovino in jo uvoziti v naš sistem</p>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-8 flex gap-3">
        <span className="text-xl">✅</span>
        <div className="text-sm text-green-800">
          <strong>Podprto:</strong> Nakup in prodaja delnic ter ETF (pozicije tipa "Real"). CFD pozicije niso vključene v DOH-KDVP in jih sistem ignorira.
        </div>
      </div>

      {/* KORAK 1 */}
      <StepSection number="1" title="Izvozi Account Statement iz eToro">
        <ol className="space-y-4">
          <Step n="1.1" text="Prijavi se v eToro na etoro.com" />
          <Step n="1.2" text='Klikni na "Portfolio" v levem meniju' />
          <Step n="1.3" text='Klikni na "History" (ikona ure) zgoraj desno' />
          <Step n="1.4" text='Klikni na gumb "Export" (puščica navzdol) v zgornjem desnem kotu' />
          <Step n="1.5" text='Izberi "Account Statement"' />
          <Step n="1.6" text='Nastavi datum "From" na 1.1. davčnega leta in "To" na 31.12. davčnega leta' />
          <Step n="1.7" text='Klikni "Create"' />
          <Step n="1.8" text="Prenesi Excel (.xlsx) datoteko ki jo pošljejo na email ali direktno v brskalnik" />
        </ol>
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          <strong>Pomembno:</strong> eToro pošlje Account Statement na tvoj email naslov. Preveri mapo Prejeto (ali Spam).
        </div>
      </StepSection>

      {/* KORAK 2 */}
      <StepSection number="2" title="Pretvori Excel v CSV">
        <p className="text-slate-600 text-sm mb-4">Naš sistem sprejme CSV format. Excel (.xlsx) datoteko moraš pretvoriti:</p>
        <ol className="space-y-3">
          <Step n="2.1" text="Odpri preneseno .xlsx datoteko v Microsoft Excel ali LibreOffice Calc" />
          <Step n="2.2" text='Klikni "Datoteka" → "Shrani kot" (File → Save As)' />
          <Step n="2.3" text='Izberi format "CSV (ločen z vejicami) (.csv)"' />
          <Step n="2.4" text="Shrani datoteko" />
        </ol>
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
          <strong>Namig:</strong> Če nimaš Excela, lahko to storiš brezplačno z LibreOffice (libreoffice.org) ali Google Sheets.
        </div>
      </StepSection>

      {/* KORAK 3 */}
      <StepSection number="3" title="Uvozi CSV v naš sistem">
        <ol className="space-y-3">
          <Step n="3.1" text='Pojdi na stran "Uvoz CSV"' />
          <Step n="3.2" text='Izberi borzo "eToro"' />
          <Step n="3.3" text="Povleci in spusti CSV datoteko ali klikni in jo izberi" />
          <Step n="3.4" text='Klikni "Uvozi iz eToro"' />
          <Step n="3.5" text="Preveri v nadzorni plošči, da so transakcije pravilno uvožene" />
        </ol>
      </StepSection>

      {/* KORAK 4 */}
      <StepSection number="4" title="Prenesi DOH-KDVP XML">
        <ol className="space-y-3">
          <Step n="4.1" text='Pojdi na stran "Poročila"' />
          <Step n="4.2" text="Izberi davčno leto" />
          <Step n="4.3" text='Klikni "Izvozi DOH-KDVP XML"' />
          <Step n="4.4" text="XML datoteka se prenese na tvoj računalnik" />
        </ol>
        <div className="mt-4">
          <Link href="/navodila/uvoz-edavki" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-500 text-sm font-medium">
            Naslednji korak: Kako uvoziti XML na eDavke →
          </Link>
        </div>
      </StepSection>

      {/* FAQ */}
      <section className="mt-8 p-6 bg-slate-50 border border-slate-200 rounded-xl">
        <h3 className="font-bold text-slate-800 mb-4">Pogosta vprašanja za eToro</h3>
        <div className="space-y-4">
          <FaqItem q="Ali moram upoštevati CFD pozicije?" a="Ne. CFD pozicije niso vrednostni papirji in se ne vključijo v DOH-KDVP. Naš sistem jih samodejno preskoči. CFD obdavčitev je drugačna — za to se posvetuj z davčnim svetovalcem." />
          <FaqItem q="eToro mi kaže transakcije v USD — kaj z menjalnimi tečaji?" a="Naš sistem pri uvozu samodejno pretvori USD vrednosti v EUR po tečaju ECB na dan transakcije. V primeru sum preverite ročno." />
          <FaqItem q="Imam transakcije iz več let — ali moram uvoziti vsako leto posebej?" a="Ne, uvozi vse naenkrat. V razdelku Poročila nato izberi posamezno leto za generiranje XML." />
        </div>
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/upload" className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors">
          Uvozi eToro CSV →
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
