import { requireUser } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import TaxpayerProfileForm from "@/components/taxpayer-profile-form";
import type { TaxpayerProfile } from "@/lib/types";

export default async function ProfilePage() {
  const user = await requireUser();

  const { data, error } = await supabaseAdmin
    .from("taxpayer_profiles")
    .select("tax_number, full_name, address, city, postal_code, country")
    .eq("user_id", user.id)
    .single();

  const initialData: TaxpayerProfile | null = data
    ? {
        taxNumber: data.tax_number,
        fullName: data.full_name,
        address: data.address,
        city: data.city,
        postalCode: data.postal_code,
        country: data.country,
      }
    : null;

  return (
    <main style={{ padding: 24, maxWidth: 1000, margin: "0 auto" }}>
      <h1>Profil za Doh-KDVP</h1>
      <p style={{ maxWidth: 720, color: "#444", marginBottom: 24 }}>
        Tukaj vnesite davčne podatke, ki se bodo uporabili za generiranje FURS/eDavki XML izvoza.
        Podatki so shranjeni za vaš uporabniški račun in se uporabljajo samo v vašem projektu.
      </p>
      <TaxpayerProfileForm initialData={initialData} />
    </main>
  );
}
