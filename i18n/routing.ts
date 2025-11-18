import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

export const routing = defineRouting({
  locales: ["en", "es", "fr"],
  defaultLocale: "en",
  localePrefix: "as-needed", // Only show locale prefix for non-default locale
});

export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);

