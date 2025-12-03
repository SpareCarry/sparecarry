import type { Metadata } from "next";
import "./globals.css";
import Script from "next/script";
import { Providers } from "./providers";
import { ErrorBoundary } from "./_components/ErrorBoundary";
import { TelemetryInitializer } from "./_components/TelemetryInitializer";
import { MobileInit } from "./_mobile-init";
import { SessionSync } from "@/components/auth/session-sync";
import { OfflineBanner } from "@/components/ui/offline-banner";
import { SkipLink } from "@/components/ui/skip-link";

// Determine base URL - use environment variable if set, otherwise default to production
const getMetadataBase = () => {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (appUrl) {
    try {
      // If it's a local/development URL (http://), use it
      return new URL(appUrl);
    } catch {
      // If invalid, fall back to production
    }
  }
  // Default to production HTTPS URL
  return new URL("https://sparecarry.com");
};

export const metadata: Metadata = {
  title: "SpareCarry – Earn $200–$3,000 using spare space you already have",
  description:
    "Get anything delivered by people already going your way — by plane in days or by boat for 80% less. SpareCarry – The traveler & sailor courier app",
  metadataBase: getMetadataBase(),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "SpareCarry – Earn $200–$3,000 using spare space you already have",
    description:
      "Get anything delivered by people already going your way — by plane in days or by boat for 80% less.",
    url: "https://sparecarry.com",
    siteName: "SpareCarry",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "SpareCarry – Earn $200–$3,000 using spare space you already have",
    description:
      "Get anything delivered by people already going your way — by plane in days or by boat for 80% less.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Resource hints for external domains - improves loading performance */}
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        <link rel="preconnect" href="https://connect.facebook.net" />
        <link
          rel="preconnect"
          href="https://js.stripe.com"
          crossOrigin="anonymous"
        />
        {process.env.NEXT_PUBLIC_SUPABASE_URL && (
          <>
            <link
              rel="preconnect"
              href={process.env.NEXT_PUBLIC_SUPABASE_URL}
            />
            <link
              rel="dns-prefetch"
              href={process.env.NEXT_PUBLIC_SUPABASE_URL}
            />
          </>
        )}
      </head>
      <body
        className="font-sans"
        style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
      >
        <ErrorBoundary>
          <Providers>
            <SkipLink />
            <OfflineBanner />
            <SessionSync />
            <TelemetryInitializer />
            <MobileInit />
            {children}

            {/* Structured Data - Organization */}
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "Organization",
                  name: "SpareCarry",
                  url: "https://sparecarry.com",
                  description:
                    "Get anything delivered by people already going your way — by plane in days or by boat for 80% less.",
                  sameAs: [],
                }),
              }}
            />

            {/* Google Analytics 4 */}
            {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
              <>
                <Script
                  src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
                  strategy="afterInteractive"
                />
                <Script id="google-analytics" strategy="afterInteractive">
                  {`
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}');
                  `}
                </Script>
              </>
            )}

            {/* Meta Pixel */}
            {process.env.NEXT_PUBLIC_META_PIXEL_ID && (
              <>
                <Script id="meta-pixel" strategy="afterInteractive">
                  {`
                    !function(f,b,e,v,n,t,s)
                    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                    n.queue=[];t=b.createElement(e);t.async=!0;
                    t.src=v;s=b.getElementsByTagName(e)[0];
                    s.parentNode.insertBefore(t,s)}(window, document,'script',
                    'https://connect.facebook.net/en_US/fbevents.js');
                    fbq('init', '${process.env.NEXT_PUBLIC_META_PIXEL_ID}');
                    fbq('track', 'PageView');
                  `}
                </Script>
                <noscript>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    height="1"
                    width="1"
                    style={{ display: "none" }}
                    src={`https://www.facebook.com/tr?id=${process.env.NEXT_PUBLIC_META_PIXEL_ID}&ev=PageView&noscript=1`}
                    alt=""
                  />
                </noscript>
              </>
            )}
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
