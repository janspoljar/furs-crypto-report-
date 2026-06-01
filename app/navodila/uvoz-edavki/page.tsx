import Link from "next/link";

export default function UvozEdavkiPage() {
  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link href="/navodila" className="hover:text-blue-600">Navodila</Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">Uvoz na eDavke</span>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <span className="text-4xl">📤</span>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Uvoz XML na portal eDavke</h1>
          <p className="text-slate-500 mt-1">Kako oddati DOH-KDVP napoved na edavki.durs.si</p>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-8 flex gap-3">
        <span className="text-xl">✅</span>
        <div className="text-sm text-green-800">
          <strong>Rok za oddajo:</strong> Napoved za kapitalske dobičke (DOH-KDVP) moraš oddati do <strong>28. februarja</strong> za preteklo davčno leto. Npr. za leto 2025 je rok 28.2.2026.
        </div>
      </div>

      {/* Predpogoji */}
      <section className="mb-8 p-5 bg-slate-50 border border-slate-200 rounded-xl">
        <h2 className="font-bold text-slate-800 mb-3">Preden začneš — potrebuješ:</h2>
        <ul className="space-y-2">
          {[
            "DOH-KDVP XML datoteko (prenesi jo iz razdelka Poročila na naši strani)",
            "Dostop do portala eDavke — prijava s SI-PASS, eID ali certifikatom",
            "Izpolnjen davčni profil z davčno številko (na naši strani: Profil)",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
              <span className="text-green-500 font-bold mt-0.5">✓</span>
              {item}
            </li>
          ))}
        </ul>
      </section>

      <StepSection number="1" title="Odpri portal eDavke">
        <ol className="space-y-3">
          <Step n="1.1" text="Pojdi na edavki.durs.si" />
          <Step n="1.2" text='Klikni "Vstopi v e-Davke"' />
          <Step n="1.3" text="Prijavi se z SI-PASS, eID ali davčnim certifikatom" />
          <Step n="1.4" text="Po uspešni prijavi boš videl pregled dokumentov" />
        </ol>
      </StepSection>

      <StepSection number="2" title="Uvozi XML datoteko">
        <ol className="space-y-4">
          <Step n="2.1" text='V levem meniju klikni na "Dokumenti"' />
          <Step n="2.2" text='Klikni gumb "Uvoz dokumenta"' />
          <Step n="2.3" text='Klikni "Izberi datoteko" in poišči tvoj DOH-KDVP XML' />
          <Step n="2.4" text='Klikni "Uvozi"' />
          <Step n="2.5" text="eDavke bo samodejno prepoznal tip obrazca (DOH-KDVP) in ga odprl v urejevalniku" />
        </ol>
        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          <strong>Namig:</strong> Če sistem javi napako pri uvozu, preveri da je XML datoteka brez okvar — generiraj jo znova iz naše strani.
        </div>
      </StepSection>

      <StepSection number="3" title="Preveri in oddaj napoved">
        <ol className="space-y-4">
          <Step n="3.1" text="Preveri uvožene podatke v urejevalniku eDavke — pregledaj vrednosti nakupov in prodaj" />
          <Step n="3.2" text="Preverite, da se skupna vrednost dobičkov/izgub ujema s podatki na naši strani" />
          <Step n="3.3" text='Klikni "Oddaj" ali "Pošlji" (odvisno od verzije)' />
          <Step n="3.4" text="Shrani potrdilo o oddaji (PDF) za svoje evidence" />
        </ol>
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
          <strong>Po oddaji:</strong> FURS ti bo po navadi v roku 30 dni poslal odmero ali potrditev. Davek je treba plačati v roku, navedenem v odmerni odločbi.
        </div>
      </StepSection>

      {/* Dividende */}
      <section className="mb-8 p-5 bg-purple-50 border border-purple-200 rounded-xl">
        <h2 className="font-bold text-purple-900 mb-3">Kaj pa dividende (DOH-DIV)?</h2>
        <p className="text-sm text-purple-800 mb-3">
          Dividende se oddajajo ločeno na obrazcu <strong>DOH-DIV</strong>. Postopek je enak — uvozi ločen XML za dividende.
          Na naši strani ga najdeš v razdelku Poročila pod &quot;DOH-DIV izvoz&quot; (Pro načrt).
        </p>
        <p className="text-sm text-purple-700">
          Rok za oddajo je enako <strong>28. februar</strong>.
        </p>
      </section>

      {/* FAQ */}
      <section className="mt-8 p-6 bg-slate-50 border border-slate-200 rounded-xl">
        <h3 className="font-bold text-slate-800 mb-4">Pogosta vprašanja</h3>
        <div className="space-y-4">
          <FaqItem
            q="Nimam SI-PASS — kako se prijavim?"
            a="SI-PASS je priporočen način. Alternativno se lahko prijaviš z osebno izkaznico z e-čipom (potrebuješ čitalnik) ali z davčnim digitalnim certifikatom. Registracija za SI-PASS je na mojiid.si."
          />
          <FaqItem
            q="Kaj storim, če sem pozabil oddati za preteklo leto?"
            a="Napoved za zamudno davčno leto oddaš z zamudo — obstaja zamudna kazen. Čim prej oddaj in se obrni na FURS za pojasnilo o kazni."
          />
          <FaqItem
            q="Ali sistem samodejno izračuna davek?"
            a="eDavke samodejno izračuna davek na podlagi uvoženih podatkov. Tvoja naloga je le da so podatki v XML pravilni — za to poskrbimo mi."
          />
          <FaqItem
            q="Imam napako pri uvozu XML — kaj storim?"
            a="Najpogostejša napaka je napačna davčna številka ali format datuma. Preveri profil na naši strani (Profil → Davčni profil) in generiraj XML znova."
          />
        </div>
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/reports" className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors">
          Pojdi na Poročila →
        </Link>
        <Link href="/navodila" className="border border-slate-300 hover:border-blue-400 text-slate-700 font-semibold px-6 py-3 rounded-xl text-sm transition-colors">
          Nazaj na vsa navodila
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
