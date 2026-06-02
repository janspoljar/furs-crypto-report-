"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function UserNav({ initialUser }: { initialUser: { id: string; email?: string } | null }) {
  const supabase = createClient();
  const [user, setUser] = useState(initialUser);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN") {
        setUser(session?.user ?? null as any);
      }
      if (event === "SIGNED_OUT") {
        setUser(null);
      }
    });

    return () => {
      data.subscription?.unsubscribe();
    };
  }, [supabase]);

  if (loading) return <div>Loading...</div>;

  if (!user) {
    return (
      <div>
        <a href="/login">Prijava</a>
      </div>
    );
  }

  async function signOut() {
    setLoading(true);
    await supabase.auth.signOut();
    setLoading(false);
  }

  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <div>{user.email || user.id}</div>
      <button onClick={signOut}>Odjava</button>
    </div>
  );
}
