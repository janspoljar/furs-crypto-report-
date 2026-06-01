import { supabaseAdmin } from "@/lib/supabase/admin";
import { FREE_TX_LIMIT } from "@/lib/constants";
export { FREE_TX_LIMIT, FREE_YEAR_LIMIT } from "@/lib/constants";

export type Plan = "free" | "pro";

export interface UserSubscription {
  plan: Plan;
  validUntil: Date | null;
  isActive: boolean;
}

export async function getUserSubscription(userId: string): Promise<UserSubscription> {
  const { data } = await supabaseAdmin
    .from("subscriptions")
    .select("plan, valid_until")
    .eq("user_id", userId)
    .single();

  if (!data) {
    return { plan: "free", validUntil: null, isActive: true };
  }

  const validUntil = data.valid_until ? new Date(data.valid_until) : null;
  const isActive = data.plan === "free" || (validUntil !== null && validUntil > new Date());

  return {
    plan: isActive ? (data.plan as Plan) : "free",
    validUntil,
    isActive,
  };
}

export async function getUserTransactionCount(userId: string): Promise<number> {
  const { count } = await supabaseAdmin
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  return count ?? 0;
}

export async function canUploadTransactions(
  userId: string,
  newCount: number
): Promise<{ allowed: boolean; currentCount: number; remaining: number }> {
  const [sub, currentCount] = await Promise.all([
    getUserSubscription(userId),
    getUserTransactionCount(userId),
  ]);

  if (sub.plan === "pro" && sub.isActive) {
    return { allowed: true, currentCount, remaining: Infinity };
  }

  const remaining = Math.max(0, FREE_TX_LIMIT - currentCount);
  return {
    allowed: currentCount + newCount <= FREE_TX_LIMIT,
    currentCount,
    remaining,
  };
}

export async function canExportXml(userId: string): Promise<{ allowed: boolean; plan: Plan }> {
  const sub = await getUserSubscription(userId);
  return {
    allowed: sub.plan === "pro" && sub.isActive,
    plan: sub.plan,
  };
}
