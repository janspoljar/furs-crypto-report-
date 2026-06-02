"use client";

import { FormEvent, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

function translateError(message: string): string {
  if (message.includes("Invalid login credentials")) return "Napačen email ali geslo.";
  if (message.includes("Email not confirmed")) return "Preverite e-pošto za potrditev računa.";
  if (message.includes("User already registered")) return "Račun s tem e-poštnim naslovom že obstaja.";
  return message;
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const tab = searchParams.get("tab") === "register" ? "register" : "login";
  const isRegister = tab === "register";

  function switchTab(t: "login" | "register") {
    const params = new URLSearchParams(searchParams.toString());
    if (t === "register") {
      params.set("tab", "register");
    } else {
      params.delete("tab");
    }
    router.replace(`/login?${params.toString()}`);
  }

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Register state
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState(false);

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });

    setLoginLoading(false);

    if (error) {
      setLoginError(translateError(error.message));
      return;
    }

    const returnUrl = searchParams.get("returnUrl") || "/upload";
    router.push(returnUrl);
    router.refresh();
  }

  async function handleRegister(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setRegError("");

    if (regPassword.length < 8) {
      setRegError("Geslo mora imeti vsaj 8 znakov.");
      return;
    }
    if (regPassword !== regConfirm) {
      setRegError("Gesli se ne ujemata.");
      return;
    }

    setRegLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: regEmail,
      password: regPassword,
    });

    setRegLoading(false);

    if (error) {
      setRegError(translateError(error.message));
      return;
    }

    if (data?.user && data.user.identities && data.user.identities.length > 0 && !data.user.email_confirmed_at && data.session == null) {
      setRegSuccess(true);
      return;
    }

    if (data?.user) {
      router.push("/upload");
      router.refresh();
      return;
    }

    setRegSuccess(true);
  }

  const activeTabStyle: React.CSSProperties = {
    background: "var(--accent-tint)",
    color: "var(--accent)",
    fontWeight: 600,
  };

  const inactiveTabStyle: React.CSSProperties = {
    background: "transparent",
    color: "var(--muted)",
    fontWeight: 500,
  };

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center" }}>
      {/* Logo */}
      <div style={{ margin: "60px auto 0", textAlign: "center" }}>
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            fontFamily: "var(--font-body)",
            fontWeight: 700,
            fontSize: 18,
            letterSpacing: "-0.01em",
            color: "var(--ink)",
            textDecoration: "none",
          }}
        >
          {/* SVG mark */}
          <svg
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ display: "block", flexShrink: 0 }}
            aria-hidden="true"
          >
            <rect width="32" height="32" rx="8" fill="var(--accent)" />
            <path
              d="M8 22 L13 13 L17 18 L21 10 L24 14"
              stroke="white"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <circle cx="24" cy="14" r="2" fill="white" />
          </svg>
          DavkiNaDelnicah.si
        </Link>
      </div>

      {/* Card */}
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: 400,
          margin: "24px auto 80px",
          padding: 40,
        }}
      >
        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: 4,
            background: "var(--surface-2)",
            borderRadius: "var(--r-sm)",
            padding: 4,
            marginBottom: 28,
          }}
        >
          <button
            type="button"
            onClick={() => switchTab("login")}
            style={{
              flex: 1,
              padding: "8px 0",
              borderRadius: "var(--r-xs)",
              fontSize: 14,
              border: "none",
              cursor: "pointer",
              transition: "background .15s, color .15s",
              ...(isRegister ? inactiveTabStyle : activeTabStyle),
            }}
          >
            Prijava
          </button>
          <button
            type="button"
            onClick={() => switchTab("register")}
            style={{
              flex: 1,
              padding: "8px 0",
              borderRadius: "var(--r-xs)",
              fontSize: 14,
              border: "none",
              cursor: "pointer",
              transition: "background .15s, color .15s",
              ...(isRegister ? activeTabStyle : inactiveTabStyle),
            }}
          >
            Registracija
          </button>
        </div>

        {/* Login form */}
        {!isRegister && (
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            <div className="field">
              <label htmlFor="login-email">E-poštni naslov</label>
              <input
                id="login-email"
                type="email"
                className="input"
                placeholder="vas@email.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="field">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 7 }}>
                <label htmlFor="login-password" style={{ margin: 0 }}>Geslo</label>
                <Link
                  href="/reset-password"
                  style={{
                    fontSize: 13,
                    color: "var(--muted)",
                    textDecoration: "none",
                  }}
                >
                  Pozabljeno geslo?
                </Link>
              </div>
              <input
                id="login-password"
                type="password"
                className="input"
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {/* Remember me */}
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 20 }}>
              <button
                type="button"
                role="checkbox"
                aria-checked={rememberMe}
                onClick={() => setRememberMe((v) => !v)}
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 5,
                  border: rememberMe ? "none" : "1.5px solid var(--line-strong)",
                  background: rememberMe ? "var(--accent)" : "var(--surface)",
                  display: "grid",
                  placeItems: "center",
                  flexShrink: 0,
                  transition: "background .15s, border-color .15s",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                {rememberMe && (
                  <svg width="11" height="9" viewBox="0 0 11 9" fill="none" aria-hidden="true">
                    <path d="M1 4.5L4 7.5L10 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
              <span
                style={{ fontSize: 13.5, color: "var(--ink-soft)", cursor: "pointer", userSelect: "none" }}
                onClick={() => setRememberMe((v) => !v)}
              >
                Ostani prijavljen
              </span>
            </div>

            {loginError && (
              <p style={{ color: "var(--neg)", fontSize: 13.5, marginBottom: 14, marginTop: -4 }}>
                {loginError}
              </p>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loginLoading}
              style={{ width: "100%", height: 46, fontSize: 15 }}
            >
              {loginLoading ? "Prijavljam..." : "Prijava"}
            </button>
          </form>
        )}

        {/* Register form */}
        {isRegister && (
          <>
            {regSuccess ? (
              <div style={{
                background: "var(--pos-tint)",
                border: "1px solid color-mix(in srgb, var(--pos) 28%, transparent)",
                borderRadius: "var(--r)",
                padding: "22px 20px",
                textAlign: "center",
              }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: "color-mix(in srgb, var(--pos) 20%, transparent)",
                  display: "grid",
                  placeItems: "center",
                  margin: "0 auto 14px",
                  color: "var(--pos)",
                }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p style={{ fontWeight: 700, fontSize: 17, color: "var(--ink)", marginBottom: 8 }}>
                  Preverite e-pošto
                </p>
                <p style={{ fontSize: 14, color: "var(--ink-soft)" }}>
                  Poslali smo vam potrditveno sporočilo. Kliknite na povezavo v e-pošti, da aktivirate račun.
                </p>
              </div>
            ) : (
              <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                <div className="field">
                  <label htmlFor="reg-email">E-poštni naslov</label>
                  <input
                    id="reg-email"
                    type="email"
                    className="input"
                    placeholder="vas@email.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>

                <div className="field">
                  <label htmlFor="reg-password">Geslo</label>
                  <input
                    id="reg-password"
                    type="password"
                    className="input"
                    placeholder="••••••••"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                  <p style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 5 }}>vsaj 8 znakov</p>
                </div>

                <div className="field">
                  <label htmlFor="reg-confirm">Potrdi geslo</label>
                  <input
                    id="reg-confirm"
                    type="password"
                    className="input"
                    placeholder="••••••••"
                    value={regConfirm}
                    onChange={(e) => setRegConfirm(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </div>

                {regError && (
                  <p style={{ color: "var(--neg)", fontSize: 13.5, marginBottom: 14, marginTop: -4 }}>
                    {regError}
                  </p>
                )}

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={regLoading}
                  style={{ width: "100%", height: 46, fontSize: 15, marginTop: 4 }}
                >
                  {regLoading ? "Registriram..." : "Ustvari račun"}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
