import { supabaseAdmin } from "@/lib/supabase/admin";

interface Props {
  userId: string;
}

export default async function TaxpayerProfileStatus({ userId }: Props) {
  const { data } = await supabaseAdmin
    .from("taxpayer_profiles")
    .select("tax_number, full_name, address, city, postal_code, country")
    .eq("user_id", userId)
    .single();

  const isComplete = !!(
    data?.tax_number &&
    data?.full_name &&
    data?.address &&
    data?.city &&
    data?.postal_code &&
    data?.country
  );

  return (
    <div
      style={{
        padding: 16,
        backgroundColor: isComplete ? "#f0f9ff" : "#ffe6e6",
        borderRadius: 8,
        border: `1px solid ${isComplete ? "#90caf9" : "#f57c7c"}`,
        marginBottom: 24,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <div
            style={{
              fontWeight: 600,
              color: isComplete ? "#1565c0" : "#c62828",
              marginBottom: 4,
            }}
          >
            {isComplete ? "✓ Profil izpolnjen" : "⚠ Profil nepopoln"}
          </div>
          <div style={{ fontSize: 13, color: "#555" }}>
            {isComplete
              ? `${data.full_name} (DV: ${data.tax_number})`
              : "Podatki za Doh-KDVP XML export so obvezni. Prosim izpolnite /profile."}
          </div>
        </div>
        {!isComplete && (
          <a
            href="/profile"
            style={{
              padding: "10px 16px",
              backgroundColor: "#c62828",
              color: "white",
              textDecoration: "none",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Uredi profil
          </a>
        )}
      </div>
    </div>
  );
}
