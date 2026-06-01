import { getUserFromServer } from "@/lib/supabase/server";
import { getUserAppProfile } from "@/lib/supabase/app-profile";
import { getAccessLevel } from "@/lib/access";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { setUserPaidOverride } from "./actions";

export default async function AdminPage() {
  // ── Step 1: Auth check ───────────────────────────────────────────────────────
  const { user } = await getUserFromServer();
  if (!user) {
    return <AccessDenied reason="Niste prijavljeni." />;
  }

  // ── Step 2: Role check ───────────────────────────────────────────────────────
  const callerProfile = await getUserAppProfile(user.id);
  const level = getAccessLevel(callerProfile, user);
  if (level !== "admin") {
    return <AccessDenied reason="Samo administratorji imajo dostop do te strani." />;
  }

  // ── Step 3: Bulk fetch — 3 queries, no N+1 ──────────────────────────────────
  const { data: authData } = await supabaseAdmin.auth.admin.listUsers({
    perPage: 1000,
  });
  const users = authData?.users ?? [];
  const userIds = users.map((u) => u.id);

  const [{ data: profiles }, { data: subscriptions }] = await Promise.all([
    supabaseAdmin
      .from("profiles")
      .select("user_id, role")
      .in("user_id", userIds),
    supabaseAdmin
      .from("subscriptions")
      .select("user_id, plan, paid_override")
      .in("user_id", userIds),
  ]);

  // ── Step 4: Merge in memory ───────────────────────────────────────────────────
  const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));
  const subMap     = new Map((subscriptions ?? []).map((s) => [s.user_id, s]));

  const rows = users.map((u) => ({
    id:          u.id,
    email:       u.email ?? "(brez e-pošte)",
    role:        profileMap.get(u.id)?.role ?? "user",
    plan:        subMap.get(u.id)?.plan ?? "free",
    override:    subMap.get(u.id)?.paid_override ?? false,
  }));

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Administracija</h1>
        <p className="text-slate-500 text-sm mt-1">
          Upravljanje dostopa · {rows.length}{" "}
          {rows.length === 1 ? "uporabnik" : "uporabnikov"}
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-slate-600 w-1/3">E-pošta</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Vloga</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Načrt</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Override</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Dejanje</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-800 font-mono text-xs truncate max-w-0 w-1/3">
                  {row.email}
                </td>
                <td className="px-4 py-3">
                  {row.role === "admin" ? (
                    <span className="text-xs font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                      Admin
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">Uporabnik</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      row.plan === "pro"
                        ? "text-green-700 bg-green-100"
                        : "text-slate-500 bg-slate-100"
                    }`}
                  >
                    {row.plan === "pro" ? "Pro" : "Brezplačno"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {row.override ? (
                    <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                      Aktivno
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <form action={setUserPaidOverride.bind(null, row.id, !row.override)}>
                    <button
                      type="submit"
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                        row.override
                          ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                          : "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                      }`}
                    >
                      {row.override ? "Odstrani plačljivo" : "Omogoči plačljivo"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

function AccessDenied({ reason }: { reason: string }) {
  return (
    <main className="max-w-lg mx-auto px-4 py-20 text-center">
      <p className="text-slate-500">{reason}</p>
      <a href="/" className="mt-4 inline-block text-sm text-blue-600 hover:underline">
        Nazaj na začetno stran
      </a>
    </main>
  );
}
