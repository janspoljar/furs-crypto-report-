import Link from "next/link";

interface UpgradePromptProps {
  title?: string;
  description?: string;
  compact?: boolean;
}

export default function UpgradePrompt({
  title = "Funkcija je na voljo za Pro naročnike",
  description = "Nadgradite na Pro za 19 €/leto in odklenite XML izvoz, neomejene transakcije in vsa davčna leta.",
  compact = false,
}: UpgradePromptProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
        <span className="text-amber-600 text-lg shrink-0">🔒</span>
        <span className="text-amber-800">{description}</span>
        <Link
          href="/#cenik"
          className="shrink-0 bg-amber-500 hover:bg-amber-400 text-white font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors"
        >
          Nadgradi
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-8 text-center">
      <div className="text-5xl mb-4">🔒</div>
      <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
      <p className="text-slate-600 mb-6 max-w-md mx-auto">{description}</p>
      <Link
        href="/#cenik"
        className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-3 rounded-xl transition-colors shadow"
      >
        Nadgradi na Pro — 19 €/leto →
      </Link>
      <p className="text-xs text-slate-400 mt-3">Brez zavezujočih pogodb. Odpoveste kadarkoli.</p>
    </div>
  );
}
