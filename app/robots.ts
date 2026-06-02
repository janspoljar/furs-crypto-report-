import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://davkinadelnicah.si";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/", "/dashboard", "/profile", "/upload", "/transactions", "/reports", "/account", "/login"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
