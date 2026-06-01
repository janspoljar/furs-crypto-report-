"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function AuthButton({ initialLoggedIn = false }: { initialLoggedIn?: boolean }) {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    await supabase.auth.signOut();
    setLoading(false);
    router.push("/login");
    router.refresh();
  }

  return (
    <button onClick={handleLogout} disabled={loading}>
      {loading ? "Odjavljanje..." : "Odjava"}
    </button>
  );
}
