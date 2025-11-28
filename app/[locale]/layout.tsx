import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "../../i18n/routing";
import { Providers } from "../providers";
import { NotificationSetup } from "../../components/notifications/notification-setup";
import "../globals.css";

export function generateStaticParams() {
  // Generate static params for all locales
  // Note: The [locale]/page.tsx route is excluded from static generation
  // by using dynamic = 'force-dynamic' to avoid next-intl config issues
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  // Load messages directly for static export compatibility (next-intl v2 pattern)
  const messages = (await import(`../../messages/${locale}.json`)).default;

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <Providers>
        {children}
        <NotificationSetup />
      </Providers>
    </NextIntlClientProvider>
  );
}

