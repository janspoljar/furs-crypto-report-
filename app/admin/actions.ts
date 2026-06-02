"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getUserFromServer } from "@/lib/supabase/server";

async function requireAdmin() {
  const { user } = await getUserFromServer();
  if (!user) throw new Error("Not authenticated");

  const { data } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (data?.role !== "admin") throw new Error("Access denied");
  return user;
}

export async function grantPro(userId: string) {
  await requireAdmin();
  const validUntil = new Date();
  validUntil.setFullYear(validUntil.getFullYear() + 1);
  await supabaseAdmin.from("subscriptions").upsert(
    { user_id: userId, plan: "pro", valid_until: validUntil.toISOString(), paid_override: false, updated_at: new Date().toISOString() },
    { onConflict: "user_id" }
  );
  revalidatePath("/admin");
}

export async function extendPro(userId: string) {
  await requireAdmin();
  const { data } = await supabaseAdmin
    .from("subscriptions")
    .select("valid_until")
    .eq("user_id", userId)
    .single();

  const base = data?.valid_until ? new Date(data.valid_until) : new Date();
  if (base < new Date()) base.setTime(new Date().getTime());
  base.setFullYear(base.getFullYear() + 1);

  await supabaseAdmin.from("subscriptions").upsert(
    { user_id: userId, plan: "pro", valid_until: base.toISOString(), updated_at: new Date().toISOString() },
    { onConflict: "user_id" }
  );
  revalidatePath("/admin");
}

export async function grantOverride(userId: string) {
  await requireAdmin();
  await supabaseAdmin.from("subscriptions").upsert(
    { user_id: userId, plan: "pro", valid_until: null, paid_override: true, updated_at: new Date().toISOString() },
    { onConflict: "user_id" }
  );
  revalidatePath("/admin");
}

export async function revokePro(userId: string) {
  await requireAdmin();
  await supabaseAdmin.from("subscriptions").upsert(
    { user_id: userId, plan: "free", valid_until: null, paid_override: false, updated_at: new Date().toISOString() },
    { onConflict: "user_id" }
  );
  revalidatePath("/admin");
}
