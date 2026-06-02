"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const LogoSvg = () => (
  <svg className="mark" viewBox="0 0 28 28" fill="none" aria-hidden="true" style={{ width: 28, height: 28 }}>
    <rect x="1" y="1" width="26" height="26" rx="7" fill="var(--accent)" />
    <path d="M7 18 L11 14 L15 16 L20 9" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <circle cx="20" cy="9" r="1.8" fill="#fff" />
    <path d="M17 19 L19 21 L23 17" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity=".85" />
  </svg>
);

const ThemeToggle = () => (
  <button className="theme-toggle" data-theme-toggle aria-label="Preklopi temo">
    <svg className="sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
    <svg className="moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  </button>
);

function MarketingHeader() {
  return (
    <header className="appbar mkt-nav">
      <div className="wrap appbar-inner">
        <a href="/" className="brand" aria-label="DavkiNaDelnicah">
          <LogoSvg />
          DavkiNaDelnicah<span style={{ color: "var(--accent)" }}>.si</span>
        </a>
        <nav className="nav-links" style={{ flex: 1, justifyContent: "center", display: "flex" }}>
          <a href="/#funkcije">Funkcije</a>
          <a href="/cenik">Cenik</a>
          <a href="/#faq">Vprašanja</a>
          <a href="/#kontakt">Kontakt</a>
        </nav>
        <div className="right">
          <ThemeToggle />
          <a href="/login" className="btn btn-ghost hidden-mobile">Prijava</a>
          <a href="/upload" className="btn btn-primary">Začni brezplačno</a>
        </div>
      </div>
    </header>
  );
}

function AuthHeader({ pathname, userEmail }: { pathname: string; userEmail?: string }) {
  const initials = userEmail
    ? userEmail.slice(0, 2).toUpperCase()
    : "JS";

  const tab = (href: string, label: string) => {
    const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
    return (
      <a href={href} className={isActive ? "active" : ""}>
        {label}
      </a>
    );
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <header className="appbar">
      <div className="wrap appbar-inner">
        <a href="/" className="brand" aria-label="DavkiNaDelnicah">
          <LogoSvg />
          <span className="hidden-mobile">
            DavkiNaDelnicah<span style={{ color: "var(--accent)" }}>.si</span>
          </span>
        </a>
        <nav className="primary">
          {tab("/upload", "Naloži")}
          {tab("/transactions", "Transakcije")}
          {tab("/reports", "Poročila")}
          {tab("/cenik", "Cenik")}
        </nav>
        <div className="right">
          <ThemeToggle />
          {userEmail ? (
            <button
              className="user-chip"
              onClick={handleSignOut}
              title="Odjavi se"
              style={{ cursor: "pointer" }}
            >
              <span className="av">{initials}</span>
              <span className="hidden-mobile">{userEmail}</span>
            </button>
          ) : (
            <a href="/login" className="btn btn-ghost btn-sm">Prijava</a>
          )}
        </div>
      </div>
    </header>
  );
}

export default function AppHeader() {
  const pathname = usePathname();
  const [userEmail, setUserEmail] = useState<string | undefined>(undefined);
  const [checked, setChecked] = useState(false);

  const isMarketing = pathname === "/";

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data?.user?.email ?? undefined);
      setChecked(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? undefined);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (isMarketing) return <MarketingHeader />;
  if (!checked) return null;
  return <AuthHeader pathname={pathname} userEmail={userEmail} />;
}
