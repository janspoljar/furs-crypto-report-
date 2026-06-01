import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function getUserFromServer() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // noop on server helpers here; setting cookies is handled in middleware/updateSession
        },
      },
    }
  );

  const { data, error } = await supabase.auth.getUser();
  return { user: data?.user ?? null, error };
}

export async function requireUser() {
  const { user } = await getUserFromServer();
  if (!user) {
    throw NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"));
  }
  return user;
}
