import Link from "next/link";

const brokerGuides = [
  { href: "/navodila/etoro", name: "eToro", icon: "🟢", description: "Izvozi Account Statement kot Excel in ga uvozi v naš sistem.", time: "~3 min", status: "Podprto" },
  { href: "/navodila/trading212", name: "Trading212", icon: "🟠", description: "Prenesi Trade History CSV iz aplikacije ali spletne strani.", time: "~2 min", status: "Podprto" },
  { href: "/navodila/revolut", name: "Revolut", icon: "🔷", description: "Izvozi Trading Account Statement iz aplikacije.", time: "~2 min", status: "Podprto" },
  { href: "/navodila/interactive-brokers", name: "Interactive Brokers", icon: "🔵", description: "Ustvari Activity Report v Flex Query formatu.", time: "~5 min", status: "Podprto" },
  { href: "/navodila/n26", name: "N26", icon: "🟤", description: "Izvozi transakcijsko zgodovino iz N26 Stocks.", time: "~2 min", status: "Podprto" },
  { href: "/navodila/trade-republic", name: "Trade Republic", icon: "⚫", description: "Podpora v razvoju — vmesna navodila so na voljo.", time: "~2 min", status: "Kmalu" },
  { href: "/navodila/saxo", name: "Saxo Bank", icon: "🔴", description: "Podpora v razvoju — vmesna navodila so na voljo.", time: "~2 min", status: "Kmalu" },
  { href: "/navodila/uvoz-edavki", name: "Uvoz XML na eDavke", icon: "📤", description: "Ko imaš XML, ga uvozi na portal eDavke v 3 korakih.", time: "~2 min", status: "Vodič" },
];

export default function NavodilaPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Navodila</h1>
        <p className="mt-2 text-slate-500 text-lg">
          Korak za korakom do davčne napovedi — za vsako podprto borzo.
        </p>
      </div>

      {/* Splošen potek */}
      <section className="mb-10 p-6 bg-blue-50 border border-blue-200 rounded-2xl">
        <h2 className="font-bold text-blue-900 text-lg mb-4">Kako celoten postopek deluje?</h2>
        <ol className="space-y-3">
          {[
            { n: "1", t: "Izvozi transakcijsko zgodovino iz borze", d: "Vsaka borza ima malo drugačen postopek — podrobna navodila so spodaj." },
            { n: "2", t: "Naloži CSV v naš sistem", d: "Povleci datoteko v upload formo. Sistem samodejno razpozna format." },
            { n: "3", t: "Preveri transakcije", d: "V nadzorni plošči preveri da so vse transakcije pravilno uvožene." },
            { n: "4", t: "Prenesi DOH-KDVP XML", d: "V razdelku Poročila izberi davčno leto in prenesi XML datoteko." },
            { n: "5", t: "Uvozi XML na eDavke", d: "Na portalu eDavke klikni Dokumenti → Uvoz in izberi XML." },
          ].map((s) => (
            <li key={s.n} className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{s.n}</span>
              <div>
                <span className="font-semibold text-blue-900">{s.t}</span>
                <span className="text-blue-700 text-sm ml-2">{s.d}</span>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Navodila po borzah */}
      <h2 className="font-bold text-xl text-slate-800 mb-4">Navodila po borzah</h2>
      <div className="grid sm:grid-cols-2 gap-4 mb-10">
        {brokerGuides.map((g) => (
          <Link
            key={g.href}
            href={g.href}
            className="flex gap-4 p-5 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all no-underline group"
          >
            <span className="text-3xl shrink-0">{g.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-slate-800 group-hover:text-blue-700">{g.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${g.status === "Podprto" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>{g.status}</span>
              </div>
              <p className="text-sm text-slate-500 mt-1">{g.description}</p>
              <p className="text-xs text-slate-400 mt-2">⏱ {g.time}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Davčne osnove */}
      <section className="p-6 bg-amber-50 border border-amber-200 rounded-2xl">
        <h2 className="font-bold text-amber-900 text-lg mb-4">Davčne osnove — kaj moraš vedeti</h2>
        <div className="space-y-3 text-sm text-amber-800">
          <div><strong>Kdaj je davek obvezen?</strong> Kadar si v davčnem letu prodal katerokoli delnice, ETF ali druge vrednostne papirje — ne glede ali si imel dobiček ali izgubo.</div>
          <div><strong>Rok za oddajo?</strong> Napoved za preteklo davčno leto moraš oddati do <strong>28. februarja</strong>. Npr. za leto 2025 je rok 28.2.2026.</div>
          <div><strong>Davčna stopnja?</strong> 25% od realiziranega kapitalskega dobička. Izgube iz preteklih let se ne morejo odbititi.</div>
          <div><strong>FIFO metoda?</strong> Zakon zahteva FIFO (first in, first out) — pri prodaji se upoštevajo najstarejši nakupi.</div>
          <div><strong>Provizije?</strong> Nakupne provizije zvišajo nabavno vrednost, prodajne provizije zmanjšajo izkupiček — oboje je davčno priznan strošek.</div>
        </div>
        <p className="text-xs text-amber-600 mt-4 italic">To ni davčni nasvet. Za specifične situacije se posvetuj z davčnim svetovalcem.</p>
      </section>
    </div>
  );
}
