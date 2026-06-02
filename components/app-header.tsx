"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  const initials = userEmail ? userEmail.slice(0, 2).toUpperCase() : "JS";

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setDrawerOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const tab = (href: string, label: string) => {
    const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
    return (
      <a href={href} className={isActive ? "active" : ""} onClick={() => setDrawerOpen(false)}>
        {label}
      </a>
    );
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

        {/* Desktop nav */}
        <nav className="primary">
          {tab("/upload", "Naloži")}
          {tab("/transactions", "Transakcije")}
          {tab("/reports", "Poročila")}
          {tab("/cenik", "Cenik")}
        </nav>

        <div className="right">
          <ThemeToggle />

          {/* Desktop user chip */}
          {userEmail ? (
            <button className="user-chip hidden-mobile" onClick={handleSignOut} title="Odjavi se" style={{ cursor: "pointer" }}>
              <span className="av">{initials}</span>
              <span>{userEmail}</span>
            </button>
          ) : (
            <a href="/login" className="btn btn-ghost btn-sm hidden-mobile">Prijava</a>
          )}

          {/* Hamburger (mobile only) */}
          <button
            className="hamburger"
            aria-label="Odpri meni"
            onClick={() => setDrawerOpen(true)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Overlay */}
      <div
        className={`nav-drawer-overlay${drawerOpen ? " open" : ""}`}
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div ref={drawerRef} className={`nav-drawer${drawerOpen ? " open" : ""}`} role="dialog" aria-modal="true" aria-label="Navigacija">
        <div className="drawer-head">
          <a href="/" className="brand" onClick={() => setDrawerOpen(false)}>
            <LogoSvg />
            DavkiNaDelnicah<span style={{ color: "var(--accent)" }}>.si</span>
          </a>
          <button onClick={() => setDrawerOpen(false)} aria-label="Zapri meni" style={{ color: "var(--muted)", lineHeight: 1 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav>
          {tab("/upload", "Naloži izpisek")}
          {tab("/transactions", "Transakcije")}
          {tab("/reports", "Poročila")}
          {tab("/cenik", "Cenik")}
        </nav>

        <div className="drawer-foot">
          {userEmail && <div className="user-info">{userEmail}</div>}
          {userEmail ? (
            <button className="btn btn-line" onClick={handleSignOut}>Odjavi se</button>
          ) : (
            <a href="/login" className="btn btn-primary">Prijava</a>
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
