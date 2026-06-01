import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/route-handler";
import { upsertTaxpayerProfile, getTaxpayerProfile } from "@/lib/supabase/profile";
import type { TaxpayerProfile } from "@/lib/types";

export async function GET() {
  const { user } = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  }

  const profile = await getTaxpayerProfile(user.id);
  return NextResponse.json({ success: true, profile });
}

export async function POST(request: Request) {
  const { user } = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const profile = body as TaxpayerProfile;
  const errors: string[] = [];

  if (!profile.taxNumber?.trim()) {
    errors.push("Davčna številka je obvezno polje.");
  } else if (!/^[0-9]{8}$/.test(profile.taxNumber.trim())) {
    errors.push("Davčna številka mora imeti 8 števk.");
  }

  if (!profile.fullName?.trim()) {
    errors.push("Ime in priimek sta obvezna.");
  }
  if (!profile.address?.trim()) {
    errors.push("Naslov je obvezen.");
  }
  if (!profile.city?.trim()) {
    errors.push("Kraj je obvezen.");
  }
  if (!profile.postalCode?.trim()) {
    errors.push("Poštna številka je obvezna.");
  }
  if (!profile.country?.trim()) {
    errors.push("Država je obvezna.");
  }

  if (errors.length > 0) {
    return NextResponse.json({ success: false, error: "Validation failed.", errors }, { status: 400 });
  }

  const { error } = await upsertTaxpayerProfile(user.id, profile);
  if (error) {
    console.error("/api/profile POST error:", error.message);
    return NextResponse.json({ success: false, error: "Unable to save profile." }, { status: 500 });
  }

  return NextResponse.json({ success: true, profile });
}
