import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUserFromServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { grantPro, extendPro, grantOverride, revokePro } from "./actions";

export const metadata: Metadata = {
  title: "Admin | DavkiNaDelnicah.si",
};

interface AdminUser {
  user_id: string;
  email: string;
  role: string;
  plan: string;
  valid_until: string | null;
  paid_override: boolean;
  tx_count: number;
}

function AccessDenied() {
  return (
    <main>
      <section className="notfound-section">
        <div>
          <div className="code" style={{ fontSize: 64 }}>403</div>
          <h1>Dostop zavrnjen</h1>
          <p>Ta stran je dostopna samo za administratorje.</p>
          <a href="/" className="btn btn-primary">Nazaj na domačo</a>
        </div>
      </section>
    </main>
  );
}

export default async function AdminPage() {
  const { user } = await getUserFromServer();
  if (!user) redirect("/login");

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (profile?.role !== "admin") return <AccessDenied />;

  // Fetch all users with their subscription and tx count
  const { data: users } = await supabaseAdmin
    .from("users")
    .select("id, email, created_at")
    .order("created_at", { ascending: false });

  const { data: subs } = await supabaseAdmin
    .from("subscriptions")
    .select("user_id, plan, valid_until, paid_override");

  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select("user_id, role");

  // Tx counts per user
  const { data: txCounts } = await supabaseAdmin
    .from("transactions")
    .select("user_id");

  const txCountMap: Record<string, number> = {};
  for (const tx of txCounts || []) {
    txCountMap[tx.user_id] = (txCountMap[tx.user_id] ?? 0) + 1;
  }

  const subsMap = Object.fromEntries((subs || []).map((s) => [s.user_id, s]));
  const profilesMap = Object.fromEntries((profiles || []).map((p) => [p.user_id, p]));

  const adminUsers: AdminUser[] = (users || []).map((u) => {
    const sub = subsMap[u.id];
    const prof = profilesMap[u.id];
    const validUntil = sub?.valid_until ?? null;
    const isExpired = validUntil && new Date(validUntil) < new Date();
    const plan = sub?.paid_override ? "pro" : (sub?.plan === "pro" && !isExpired ? "pro" : "free");
    return {
      user_id: u.id,
      email: u.email ?? "(brez e-pošte)",
      role: prof?.role ?? "user",
      plan,
      valid_until: validUntil,
      paid_override: sub?.paid_override ?? false,
      tx_count: txCountMap[u.id] ?? 0,
    };
  });

  const totalUsers = adminUsers.length;
  const proUsers = adminUsers.filter((u) => u.plan === "pro").length;
  const freeUsers = totalUsers - proUsers;
  const overrideUsers = adminUsers.filter((u) => u.paid_override).length;

  return (
    <main>
      <section className="page-head">
        <div className="wrap">
          <h1>Admin plošča</h1>
          <p>Upravljanje uporabnikov, naročnin in pravic.</p>
        </div>
      </section>

      <section className="wrap" style={{ paddingBottom: 80 }}>
        {/* Stats */}
        <div className="admin-stats" style={{ marginBottom: 28 }}>
          <div className="admin-stat">
            <div className="k">Skupaj uporabnikov</div>
            <div className="v">{totalUsers}</div>
          </div>
          <div className="admin-stat">
            <div className="k">Pro načrt</div>
            <div className="v" style={{ color: "var(--pos)" }}>{proUsers}</div>
          </div>
          <div className="admin-stat">
            <div className="k">Brezplačni</div>
            <div className="v">{freeUsers}</div>
          </div>
          <div className="admin-stat">
            <div className="k">Override</div>
            <div className="v" style={{ color: "var(--warn)" }}>{overrideUsers}</div>
          </div>
        </div>

        {/* Users table */}
        <div className="tbl-wrap">
          <div className="tbl-scroll">
            <table className="data admin">
              <thead>
                <tr>
                  <th>E-pošta</th>
                  <th>Vloga</th>
                  <th>Načrt</th>
                  <th>Veljavno do</th>
                  <th className="num">Transakcij</th>
                  <th style={{ textAlign: "right" }}>Akcije</th>
                </tr>
              </thead>
              <tbody>
                {adminUsers.map((u) => {
                  const hasValidUntil = u.valid_until !== null;
                  const expired = hasValidUntil && new Date(u.valid_until!) < new Date();

                  return (
                    <tr key={u.user_id}>
                      <td className="mono" style={{ fontSize: 13 }}>{u.email}</td>
                      <td>
                        {u.role === "admin"
                          ? <span className="badge badge-admin">Admin</span>
                          : <span className="badge badge-info">Uporabnik</span>}
                      </td>
                      <td>
                        {u.paid_override
                          ? <span className="badge badge-override">Override ∞</span>
                          : u.plan === "pro"
                            ? <span className="badge badge-pro"><span className="dot" />Pro</span>
                            : <span className="badge badge-free"><span className="dot" />Free</span>}
                      </td>
                      <td style={{ fontSize: 13 }}>
                        {u.paid_override
                          ? "∞"
                          : hasValidUntil
                            ? <span style={{ color: expired ? "var(--neg)" : "var(--pos)" }}>
                                {new Date(u.valid_until!).toLocaleDateString("sl-SI")}
                                {expired ? " (potekel)" : ""}
                              </span>
                            : <span style={{ color: "var(--muted)" }}>—</span>}
                      </td>
                      <td className="num mono">{u.tx_count}</td>
                      <td>
                        <div className="actions">
                          {u.plan !== "pro" && !u.paid_override && (
                            <form action={grantPro.bind(null, u.user_id)}>
                              <button type="submit" className="btn btn-primary btn-sm">+ Pro 12m</button>
                            </form>
                          )}
                          {!u.paid_override && (
                            <form action={grantOverride.bind(null, u.user_id)}>
                              <button type="submit" className="btn btn-line btn-sm">∞ Override</button>
                            </form>
                          )}
                          {hasValidUntil && (
                            <form action={extendPro.bind(null, u.user_id)}>
                              <button type="submit" className="btn btn-line btn-sm">+12m</button>
                            </form>
                          )}
                          {(u.plan === "pro" || u.paid_override) && (
                            <form action={revokePro.bind(null, u.user_id)}>
                              <button type="submit" className="btn btn-ghost btn-sm" style={{ color: "var(--neg)" }}>Odstrani Pro</button>
                            </form>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
