import { getUserFromServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const { user, error } = await getUserFromServer();

  // Redirect to login if user is not authenticated
  if (error || !user) {
    redirect("/login");
  }

  return (
    <main style={{ maxWidth: 900, margin: "40px auto", padding: 16 }}>
      <div style={{ marginBottom: 24 }}>
        <h1>Dashboard</h1>
        <p style={{ color: "#666" }}>Prijavljen kot: <strong>{user.email || user.id}</strong></p>
      </div>

      <div style={{
        padding: 16,
        backgroundColor: "#f5f5f5",
        borderRadius: 8,
        marginBottom: 24,
      }}>
        <h2>Pregled</h2>
        <p>Tu bo pregled tvojih importov in transakcij.</p>
        <ul style={{ marginTop: 12 }}>
          <li>Uvozene transakcije: --</li>
          <li>Skupna vrednost: --</li>
          <li>Zadnji import: --</li>
        </ul>
      </div>

      <div style={{
        padding: 16,
        border: "1px solid #ddd",
        borderRadius: 8,
      }}>
        <h3>Naslednji koraki</h3>
        <ul>
          <li>Pojdi na <a href="/upload">/upload</a> za import Trading212 CSV-ja</li>
          <li>Pojdi na <a href="/transactions">/transactions</a> za pregled transakcij</li>
          <li>Pripravi XML report za eDavke</li>
        </ul>
      </div>
    </main>
  );
}
