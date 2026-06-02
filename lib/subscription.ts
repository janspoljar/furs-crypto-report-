import { supabaseAdmin } from "@/lib/supabase/admin";

export interface SubscriptionStatus {
  plan: "free" | "pro";
  isPro: boolean;
  validUntil: Date | null;
  paidOverride: boolean;
}

export async function getSubscription(userId: string): Promise<SubscriptionStatus> {
  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select("plan, valid_until, paid_override")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return { plan: "free", isPro: false, validUntil: null, paidOverride: false };
  }

  const validUntil = data.valid_until ? new Date(data.valid_until) : null;
  const paidOverride = data.paid_override === true;
  const planIsPro = data.plan === "pro";
  const notExpired = !validUntil || validUntil > new Date();
  const isPro = paidOverride || (planIsPro && notExpired);

  return {
    plan: isPro ? "pro" : "free",
    isPro,
    validUntil,
    paidOverride,
  };
}
