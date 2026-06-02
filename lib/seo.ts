import type { Metadata } from "next";

export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://davkinadelnicah.si";
export const SITE_NAME = "DavkiNaDelnicah.si";

const OG_IMAGE = { url: "/og-image.png", width: 1200, height: 630 };

/**
 * Generates consistent title/description/canonical/OG/Twitter metadata.
 * Centralises APP_URL, SITE_NAME, og-image path so a single update propagates everywhere.
 */
export function buildMetadata(opts: {
  title: string;
  description: string;
  /** URL path, e.g. "/cenik". Omit for the root page. */
  path?: string;
  /** Shorter copy for og:description and twitter:description. Falls back to description. */
  shortDescription?: string;
  ogImageAlt?: string;
  /** Skip og:image entirely (suitable for legal/utility pages). */
  noOgImage?: boolean;
  robots?: Metadata["robots"];
}): Metadata {
  const { title, description, path = "", shortDescription, ogImageAlt, noOgImage, robots } = opts;
  const url = path ? `${APP_URL}${path}` : APP_URL;
  const ogDesc = shortDescription ?? description;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description: ogDesc,
      url,
      siteName: SITE_NAME,
      type: "website",
      locale: "sl_SI",
      ...(noOgImage ? {} : { images: [{ ...OG_IMAGE, alt: ogImageAlt ?? title }] }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: ogDesc,
      ...(noOgImage ? {} : { images: [OG_IMAGE.url] }),
    },
    ...(robots ? { robots } : {}),
  };
}

/**
 * WebSite schema for the homepage.
 * SearchAction omitted — no site-search functionality exists on this site.
 */
export function buildWebSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: APP_URL,
  };
}

// Organization constants.
// Set NEXT_PUBLIC_ORG_NAME env var to enable the Organization schema.
// Logo omitted until /public/logo.png is provided.
const ORG_NAME = process.env.NEXT_PUBLIC_ORG_NAME ?? "";
const ORG_EMAIL = "podpora@davkinadelnicah.si";

/**
 * Organization schema. Returns null if ORG_NAME is not configured,
 * preventing placeholder data from appearing in structured-data output.
 */
export function buildOrganizationJsonLd(): object | null {
  if (!ORG_NAME) return null;
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: ORG_NAME,
    url: APP_URL,
    email: ORG_EMAIL,
  };
}
