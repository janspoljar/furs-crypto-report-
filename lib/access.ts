// lib/access.ts
//
// Single source of truth for all access control logic.
// Pure module: no imports, no DB calls, no side effects.
// Every access decision in the app should route through these helpers.

// ── Types ─────────────────────────────────────────────────────────────────────

export type AppRole     = "user" | "admin";
export type AppPlan     = "free" | "paid";
export type AccessLevel = "guest" | "free" | "paid" | "admin";

export type Feature =
  | "advanced_reports"
  | "multi_broker_import"
  | "priority_support"
  | "bulk_xml_export";

// "public" → anyone, including unauthenticated visitors
// "member" → any logged-in user, free or paid
// "paid"   → paid plan OR paid_override OR admin
// "admin"  → admin role only
type FeatureGate = "public" | "member" | "paid" | "admin";

// AppProfile is the merged access record built by lib/supabase/app-profile.ts.
// It contains only the fields needed for access decisions — not tax/billing detail.
export interface AppProfile {
  userId:       string;
  role:         AppRole;
  plan:         AppPlan;
  paidOverride: boolean;
}

// Minimal user shape. Avoids importing @supabase/supabase-js into this module.
// Supabase's User satisfies this interface.
type AuthUserRef = { id: string } | null;

// ── Feature gate map ──────────────────────────────────────────────────────────
//
// This is the one place to edit when rolling out paid features.
// To restrict a feature to paid users: change "member" → "paid".
// To open a feature to everyone including guests: change to "public".
// No other code needs to change.

const FEATURE_GATE: Record<Feature, FeatureGate> = {
  advanced_reports:    "member", // beta: open to all members → flip to "paid" when billing ships
  multi_broker_import: "member", // beta: open to all members → flip to "paid" when billing ships
  priority_support:    "paid",   // always paid
  bulk_xml_export:     "member", // beta: open to all members → flip to "paid" when billing ships
};

// ── Access level ──────────────────────────────────────────────────────────────

export function getAccessLevel(
  profile: AppProfile | null,
  user: AuthUserRef
): AccessLevel {
  if (!user)                                      return "guest";
  if (!profile)                                   return "free"; // logged in, no profile yet
  if (profile.role === "admin")                   return "admin";
  if (profile.plan === "paid" || profile.paidOverride) return "paid";
  return "free";
}

// ── Convenience helpers ───────────────────────────────────────────────────────

export function isAdmin(profile: AppProfile | null): boolean {
  return profile?.role === "admin";
}

export function hasPaidAccess(profile: AppProfile | null): boolean {
  return profile?.plan === "paid" || profile?.paidOverride === true;
}

// ── Feature gating ────────────────────────────────────────────────────────────

export function canUseFeature(
  profile: AppProfile | null,
  user: AuthUserRef,
  feature: Feature
): boolean {
  const level = getAccessLevel(profile, user);

  // Admins bypass all feature gates unconditionally.
  if (level === "admin") return true;

  const gate = FEATURE_GATE[feature];

  switch (gate) {
    case "public":  return true;
    case "member":  return user !== null;
    case "paid":    return level === "paid";
    case "admin":   return false; // only reachable when level !== "admin"
    default:        return false;
  }
}
