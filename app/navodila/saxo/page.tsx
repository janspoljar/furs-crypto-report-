import Link from "next/link";

export default function SaxoNavodilaPage() {
  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link href="/navodila" className="hover:text-blue-600">Navodila</Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">Saxo Bank</span>
      </div>

      <div className="flex items-center gap-3 mb-8">
        <span className="text-4xl">🔴</span>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Saxo Bank — kmalu</h1>
          <p className="text-slate-500 mt-1">Navodila za izvoz in uvoz Saxo transakcij</p>
        </div>
      </div>

      <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl mb-8">
        <div className="flex gap-3">
          <span className="text-2xl">🔧</span>
          <div>
            <h2 className="font-bold text-amber-900 mb-1">Podpora prihaja kmalu</h2>
            <p className="text-amber-800 text-sm leading-relaxed">
              Razvijamo podporo za Saxo Bank izvozni format. Pričakujemo jo v prihodnji posodobitvi.
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl mb-6">
        <h3 className="font-semibold text-slate-800 mb-3">Medtem — kako začasno uvoziti podatke</h3>
        <ol className="space-y-3 text-sm text-slate-600">
          <li className="flex gap-3">
            <span className="text-blue-600 font-bold shrink-0">1.</span>
            Pojdi na Saxo Trader → Account → Reports
          </li>
          <li className="flex gap-3">
            <span className="text-blue-600 font-bold shrink-0">2.</span>
            Izberi &quot;Trade Confirmation&quot; ali &quot;Account Statement&quot; in prenesi CSV
          </li>
          <li className="flex gap-3">
            <span className="text-blue-600 font-bold shrink-0">3.</span>
            Izberi &quot;Drugo&quot; pri uvozu — generični parser bo poskusil prebrati standardne stolpce
          </li>
        </ol>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/upload" className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors">
          Poskusi uvoziti →
        </Link>
        <Link href="/navodila" className="border border-slate-300 hover:border-blue-400 text-slate-700 font-semibold px-6 py-3 rounded-xl text-sm transition-colors">
          Nazaj na navodila
        </Link>
      </div>
    </div>
  );
}
