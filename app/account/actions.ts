"use server";

import { requireUser, getUserFromServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

export async function exportUserData(): Promise<{ data: string; filename: string }> {
  const user = await requireUser();

  const { data: transactions, error } = await supabaseAdmin
    .from("transactions")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: true });

  if (error) {
    throw new Error("Napaka pri izvozu podatkov: " + error.message);
  }

  const date = new Date().toISOString().split("T")[0];
  const filename = `transakcije-${date}.json`;
  const data = JSON.stringify(transactions ?? [], null, 2);

  return { data, filename };
}

export async function deleteAccount(confirmText: string): Promise<{ error?: string }> {
  if (confirmText !== "IZBRIŠI") {
    return { error: "Vnesi IZBRIŠI za potrditev" };
  }

  const user = await requireUser();
  const userId = user.id;

  const { error: txError } = await supabaseAdmin
    .from("transactions")
    .delete()
    .eq("user_id", userId);

  if (txError) {
    return { error: "Napaka pri brisanju transakcij: " + txError.message };
  }

  const { error: subError } = await supabaseAdmin
    .from("subscriptions")
    .delete()
    .eq("user_id", userId);

  if (subError) {
    return { error: "Napaka pri brisanju naročnine: " + subError.message };
  }

  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .delete()
    .eq("user_id", userId);

  // profiles table might not exist or user might not have a profile — ignore 404-like errors
  if (profileError && !profileError.message.includes("does not exist")) {
    console.error("deleteAccount: profiles delete error (non-fatal):", profileError.message);
  }

  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

  if (authError) {
    return { error: "Napaka pri brisanju računa: " + authError.message };
  }

  redirect("/");
}

export async function sendPasswordReset(): Promise<{ error?: string; success?: boolean }> {
  const { user } = await getUserFromServer();
  if (!user?.email) {
    return { error: "Niste prijavljeni." };
  }

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://davkinadelnicah.si";

  const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
    redirectTo: appUrl + "/update-password",
  });

  if (error) {
    return { error: "Napaka pri pošiljanju e-pošte: " + error.message };
  }

  return { success: true };
}
