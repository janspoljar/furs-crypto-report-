"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isRegister, setIsRegister] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (isRegister) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      setLoading(false);

      if (error) {
        setError(error.message);
        return;
      }

      // If email confirmation is required, Supabase returns user null and a message
      if (data?.user == null) {
        setSuccess(
          "Registracija uspešna. Preverite svoj email za potrditev (če je potrebna)."
        );
        return;
      }

      // If user is returned, sign-in likely happened automatically
      router.push("/dashboard");
      router.refresh();
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main style={{ maxWidth: 520, margin: "40px auto", padding: 16 }}>
      <h1>{isRegister ? "Registracija" : "Prijava"}</h1>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Geslo"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? (isRegister ? "Registriram..." : "Prijavljam...") : isRegister ? "Registracija" : "Prijava"}
        </button>

        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={() => setIsRegister((s) => !s)}>
            {isRegister ? "Imam račun? Prijava" : "Nimam računa? Registracija"}
          </button>
        </div>

        {error ? <p style={{ color: "red" }}>{error}</p> : null}
        {success ? <p style={{ color: "green" }}>{success}</p> : null}
      </form>
    </main>
  );
}