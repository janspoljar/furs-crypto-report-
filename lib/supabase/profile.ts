import { supabaseAdmin } from "./admin";
import type { TaxpayerProfile } from "@/lib/types";

export async function getTaxpayerProfile(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("taxpayer_profiles")
    .select("tax_number, full_name, address, city, postal_code, country")
    .eq("user_id", userId)
    .single();

  if (error) {
    console.error("[profile] getTaxpayerProfile error:", error.message, "userId:", userId);
    return null;
  }

  if (!data) {
    return null;
  }

  return {
    taxNumber: data.tax_number,
    fullName: data.full_name,
    address: data.address,
    city: data.city,
    postalCode: data.postal_code,
    country: data.country,
  } as TaxpayerProfile;
}

export async function upsertTaxpayerProfile(userId: string, profile: TaxpayerProfile) {
  const { data, error } = await supabaseAdmin
    .from("taxpayer_profiles")
    .upsert(
      {
        user_id: userId,
        tax_number: profile.taxNumber,
        full_name: profile.fullName,
        address: profile.address,
        city: profile.city,
        postal_code: profile.postalCode,
        country: profile.country,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  return { data, error };
}
