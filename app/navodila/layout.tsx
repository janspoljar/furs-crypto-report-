import Link from "next/link";

const guides = [
  { href: "/navodila", label: "Pregled", icon: "📚" },
  { href: "/navodila/etoro", label: "eToro", icon: "🟢" },
  { href: "/navodila/trading212", label: "Trading212", icon: "🟠" },
  { href: "/navodila/revolut", label: "Revolut", icon: "🔷" },
  { href: "/navodila/interactive-brokers", label: "Interactive Brokers", icon: "🔵" },
  { href: "/navodila/n26", label: "N26", icon: "🟤" },
  { href: "/navodila/trade-republic", label: "Trade Republic", icon: "⚫" },
  { href: "/navodila/saxo", label: "Saxo Bank", icon: "🔴" },
  { href: "/navodila/uvoz-edavki", label: "Uvoz na eDavke", icon: "📤" },
];

export default function NavodilaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10 flex gap-8">
      {/* Sidebar */}
      <aside className="hidden md:block w-56 shrink-0">
        <div className="sticky top-20">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-2">Navodila</p>
          <nav className="flex flex-col gap-1">
            {guides.map((g) => (
              <Link
                key={g.href}
                href={g.href}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-700 font-medium transition-colors no-underline"
              >
                <span>{g.icon}</span>
                {g.label}
              </Link>
            ))}
          </nav>
          <div className="mt-6 p-3 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-xs text-blue-700 font-medium">Imaš vprašanje?</p>
            <p className="text-xs text-blue-600 mt-1">Piši nam na <a href="mailto:info@davkinaldelnice.si" className="underline">info@davkinaldelnice.si</a></p>
          </div>
        </div>
      </aside>

      {/* Mobile nav */}
      <div className="md:hidden w-full">
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
          {guides.map((g) => (
            <Link key={g.href} href={g.href} className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-slate-100 text-slate-700 hover:bg-blue-100 hover:text-blue-700 font-medium no-underline">
              <span>{g.icon}</span>
              {g.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
}
