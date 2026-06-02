import { getUserFromServer } from "@/lib/supabase/server";
import { getUserAppProfile } from "@/lib/supabase/app-profile";
import { getAccessLevel } from "@/lib/access";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { setUserPlan, setUserPaidOverride } from "./actions";

export default async function AdminPage() {
  const { user } = await getUserFromServer();
  if (!user) return <AccessDenied reason="Niste prijavljeni." />;

  const callerProfile = await getUserAppProfile(user.id);
  const level = getAccessLevel(callerProfile, user);
  if (level !== "admin") return <AccessDenied reason="Samo administratorji imajo dostop do te strani." />;

  // Bulk fetch — brez N+1
  const { data: authData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  const users = authData?.users ?? [];
  const userIds = users.map((u) => u.id);

  const [{ data: profiles }, { data: subscriptions }, { data: txCounts }] = await Promise.all([
    supabaseAdmin.from("profiles").select("user_id, role").in("user_id", userIds),
    supabaseAdmin.from("subscriptions").select("user_id, plan, paid_override, valid_until").in("user_id", userIds),
    supabaseAdmin.from("transactions").select("user_id").in("user_id", userIds),
  ]);

  const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));
  const subMap     = new Map((subscriptions ?? []).map((s) => [s.user_id, s]));

  // Število transakcij po userju
  const txCountMap = new Map<string, number>();
  for (const tx of txCounts ?? []) {
    txCountMap.set(tx.user_id, (txCountMap.get(tx.user_id) ?? 0) + 1);
  }

  const rows = users.map((u) => {
    const sub = subMap.get(u.id);
    const validUntil = sub?.valid_until ? new Date(sub.valid_until) : null;
    const isExpired = validUntil ? validUntil < new Date() : false;
    const isPro = sub?.plan === "pro" && (sub?.paid_override || !validUntil || !isExpired);
    return {
      id:         u.id,
      email:      u.email ?? "(brez e-pošte)",
      role:       profileMap.get(u.id)?.role ?? "user",
      plan:       (sub?.plan ?? "free") as "free" | "pro",
      override:   sub?.paid_override ?? false,
      validUntil,
      isExpired,
      isPro,
      txCount:    txCountMap.get(u.id) ?? 0,
    };
  });

  const proCount  = rows.filter((r) => r.isPro).length;
  const freeCount = rows.length - proCount;

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Administracija</h1>
          <p className="text-slate-500 text-sm mt-1">
            {rows.length} uporabnikov &middot; {proCount} Pro &middot; {freeCount} brezplačnih
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          <span className="bg-green-100 text-green-700 font-semibold px-3 py-1.5 rounded-full">{proCount} Pro</span>
          <span className="bg-slate-100 text-slate-600 font-semibold px-3 py-1.5 rounded-full">{freeCount} Free</span>
        </div>
      </div>

      {/* Tabela */}
      <div className="rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">E-pošta</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Vloga</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Plan</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Velja do</th>
              <th className="text-right px-4 py-3 font-semibold text-slate-600">Transakcije</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Upravljanje</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50">
                {/* E-pošta */}
                <td className="px-4 py-3 font-mono text-xs text-slate-700 max-w-[220px] truncate">
                  {row.email}
                </td>

                {/* Vloga */}
                <td className="px-4 py-3">
                  {row.role === "admin"
                    ? <span className="text-xs font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">Admin</span>
                    : <span className="text-xs text-slate-400">Uporabnik</span>}
                </td>

                {/* Plan */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      row.isPro ? "text-green-700 bg-green-100" : "text-slate-500 bg-slate-100"
                    }`}>
                      {row.isPro ? "Pro" : "Free"}
                    </span>
                    {row.override && (
                      <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">override</span>
                    )}
                    {row.isExpired && row.plan === "pro" && (
                      <span className="text-xs text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full">potekel</span>
                    )}
                  </div>
                </td>

                {/* Velja do */}
                <td className="px-4 py-3 text-xs text-slate-500">
                  {row.validUntil
                    ? row.validUntil.toLocaleDateString("sl-SI", { day: "2-digit", month: "2-digit", year: "numeric" })
                    : row.plan === "pro" ? <span className="text-green-600 font-medium">∞ Doživljenjsko</span> : "—"
                  }
                </td>

                {/* Transakcije */}
                <td className="px-4 py-3 text-right text-xs font-mono text-slate-600">
                  {row.txCount}
                </td>

                {/* Upravljanje */}
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    {/* Nastavi Pro 12 mesecev */}
                    {!row.isPro && (
                      <form action={setUserPlan.bind(null, row.id, "pro", 12)}>
                        <button type="submit" className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 transition-colors">
                          + Pro 12m
                        </button>
                      </form>
                    )}

                    {/* Doživljenjski Pro (brez poteka) */}
                    {!row.override && (
                      <form action={setUserPaidOverride.bind(null, row.id, true)}>
                        <button type="submit" className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
                          ∞ Override
                        </button>
                      </form>
                    )}

                    {/* Odstrani vse */}
                    {(row.isPro || row.override) && (
                      <form action={setUserPlan.bind(null, row.id, "free", 0)}>
                        <button type="submit" className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors">
                          Odstrani Pro
                        </button>
                      </form>
                    )}

                    {/* Podaljaj za 12m */}
                    {row.isPro && row.validUntil && (
                      <form action={setUserPlan.bind(null, row.id, "pro", 12)}>
                        <button type="submit" className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors">
                          +12m
                        </button>
                      </form>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-slate-400">
        „Override“ ignorira valid_until in doda Pro brez poteka. „Pro 12m“ nastavi plan=pro in valid_until=+12 mesecev.
      </p>
    </main>
  );
}

function AccessDenied({ reason }: { reason: string }) {
  return (
    <main className="max-w-lg mx-auto px-4 py-20 text-center">
      <p className="text-slate-500">{reason}</p>
      <a href="/" className="mt-4 inline-block text-sm text-blue-600 hover:underline">Nazaj na začetno stran</a>
    </main>
  );
}
