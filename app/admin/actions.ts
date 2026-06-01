"use server";

import { revalidatePath } from "next/cache";
import { getUserFromServer } from "@/lib/supabase/server";
import { getUserAppProfile } from "@/lib/supabase/app-profile";
import { isAdmin } from "@/lib/access";
import { supabaseAdmin } from "@/lib/supabase/admin";

function adminGuard(caller: Awaited<ReturnType<typeof getUserFromServer>>["user"], profile: Awaited<ReturnType<typeof getUserAppProfile>>) {
  if (!caller) throw new Error("Unauthenticated");
  if (!isAdmin(profile)) throw new Error("Forbidden");
}

// Nastavi plan in valid_until za ciljnega uporabnika
export async function setUserPlan(
  targetUserId: string,
  plan: "free" | "pro",
  months: number // 0 = brez poteka (null)
): Promise<void> {
  const { user } = await getUserFromServer();
  const callerProfile = await getUserAppProfile(user?.id ?? "");
  try { adminGuard(user, callerProfile); } catch (e) {
    console.error("[admin] setUserPlan unauthorized:", e); return;
  }

  const validUntil = plan === "pro" && months > 0
    ? new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000).toISOString()
    : null;

  const { error } = await supabaseAdmin
    .from("subscriptions")
    .upsert(
      { user_id: targetUserId, plan, valid_until: validUntil, paid_override: false },
      { onConflict: "user_id" }
    );

  if (error) { console.error("[admin] setUserPlan DB error:", error.message); return; }
  revalidatePath("/admin");
}

// Nastavi paid_override (hitra pot brez poteka)
export async function setUserPaidOverride(
  targetUserId: string,
  value: boolean
): Promise<void> {
  const { user } = await getUserFromServer();
  const callerProfile = await getUserAppProfile(user?.id ?? "");
  try { adminGuard(user, callerProfile); } catch (e) {
    console.error("[admin] setUserPaidOverride unauthorized:", e); return;
  }

  const { error } = await supabaseAdmin
    .from("subscriptions")
    .upsert(
      { user_id: targetUserId, paid_override: value },
      { onConflict: "user_id" }
    );

  if (error) { console.error("[admin] setUserPaidOverride DB error:", error.message); return; }
  revalidatePath("/admin");
}
