import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://sparecarry.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/auth/", "/onboarding/", "/home/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
