import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SpareCarry – Earn $200–$3,000 using spare space you already have",
  description: "Get anything delivered by people already going your way — by plane in days or by boat for 80% less. SpareCarry – The traveler & sailor courier app",
  metadataBase: new URL("https://sparecarry.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "SpareCarry – Earn $200–$3,000 using spare space you already have",
    description: "Get anything delivered by people already going your way — by plane in days or by boat for 80% less.",
    url: "https://sparecarry.com",
    siteName: "SpareCarry",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "SpareCarry – Earn $200–$3,000 using spare space you already have",
    description: "Get anything delivered by people already going your way — by plane in days or by boat for 80% less.",
    domain: "sparecarry.com",
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
      <body className={inter.className}>
        <Providers>
          {children}
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
      </body>
    </html>
  );
}

