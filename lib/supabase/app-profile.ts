// lib/supabase/app-profile.ts
//
// The only DB layer that builds AppProfile.
// Merges: auth user id + profiles.role + subscriptions.plan + subscriptions.paid_override
//
// Canonical field ownership reminder:
//   profiles.role          → authoritative for access control
//   subscriptions.plan     → authoritative for billing tier
//                            (DB stores 'free'|'pro'; mapped to AppPlan 'free'|'paid' here)
//   subscriptions.paid_override → authoritative for manual admin override
//   taxpayer_profiles.*    → authoritative for tax XML (city, postal_code, country etc.)
//                            Do NOT use profiles for XML generation.

import { supabaseAdmin } from "./admin";
import type { AppProfile } from "@/lib/access";

// PostgREST "no rows returned" error code from .single()
const PGRST116 = "PGRST116";

export async function getUserAppProfile(userId: string): Promise<AppProfile> {
  const [profileResult, subResult] = await Promise.all([
    supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("user_id", userId)
      .single(),
    supabaseAdmin
      .from("subscriptions")
      .select("plan, paid_override")
      .eq("user_id", userId)
      .single(),
  ]);

  // Only upsert when the row is genuinely missing (PGRST116), not for
  // network errors, permission errors, or other DB failures.
  if (profileResult.error?.code === PGRST116) {
    await supabaseAdmin
      .from("profiles")
      .upsert({ user_id: userId, role: "user" }, { onConflict: "user_id" });
  }

  if (subResult.error?.code === PGRST116) {
    await supabaseAdmin
      .from("subscriptions")
      .upsert(
        { user_id: userId, plan: "free", paid_override: false },
        { onConflict: "user_id" }
      );
  }

  // Map DB plan enum ('free' | 'pro') → AppPlan ('free' | 'paid').
  // The DB uses 'pro' for legacy/Stripe reasons; access.ts uses 'paid' semantically.
  // lib/subscription.ts continues to use 'pro' for its own purposes — no conflict.
  const rawPlan = subResult.data?.plan as "free" | "pro" | undefined;
  const plan: "free" | "paid" = rawPlan === "pro" ? "paid" : "free";

  return {
    userId,
    role:         (profileResult.data?.role as "user" | "admin" | undefined) ?? "user",
    plan,
    paidOverride: subResult.data?.paid_override ?? false,
  };
}
