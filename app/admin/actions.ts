"use server";

import { revalidatePath } from "next/cache";
import { getUserFromServer } from "@/lib/supabase/server";
import { getUserAppProfile } from "@/lib/supabase/app-profile";
import { isAdmin } from "@/lib/access";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Toggles paid_override for a target user.
// Authorization is re-verified inside this action — never trusting client state.
// Returns void (required for use as a form action); errors are logged server-side.
export async function setUserPaidOverride(
  targetUserId: string,
  value: boolean
): Promise<void> {
  // Step 1: Re-read auth from cookies. Never trust caller-provided identity.
  const { user } = await getUserFromServer();
  if (!user) {
    console.error("[admin] setUserPaidOverride: unauthenticated call");
    return;
  }

  // Step 2: Re-read role from DB. Never trust any profile passed from the client.
  const callerProfile = await getUserAppProfile(user.id);
  if (!isAdmin(callerProfile)) {
    console.error("[admin] setUserPaidOverride: non-admin attempt by", user.id);
    return;
  }

  // Step 3: Upsert only paid_override.
  // On conflict (row exists): updates paid_override, leaves plan untouched.
  // On insert (no row yet): plan defaults to 'free' from the column default.
  const { error } = await supabaseAdmin
    .from("subscriptions")
    .upsert(
      { user_id: targetUserId, paid_override: value },
      { onConflict: "user_id" }
    );

  if (error) {
    console.error("[admin] setUserPaidOverride DB error:", error.message);
    return;
  }

  revalidatePath("/admin");
}
