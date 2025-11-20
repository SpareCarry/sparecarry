// next-intl v2 request configuration
import { routing } from "./routing";

export async function getMessages(locale: string) {
  return (await import(`../messages/${locale}.json`)).default;
}

export function getLocale(request: { headers: { get: (name: string) => string | null } }): string {
  // For static export, locale comes from route params
  // This function is mainly for SSR compatibility
  const locale = request.headers.get("x-next-intl-locale");
  if (locale && routing.locales.includes(locale as any)) {
    return locale;
  }
  return routing.defaultLocale;
}

