// This page handles /en, /es, /fr routes
// It redirects to the home page with the locale
// Using a simple HTML redirect to avoid next-intl initialization
import { redirect } from 'next/navigation';

// Force dynamic to prevent static generation (which triggers next-intl config lookup)
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export default function LocalePage() {
  // Simple redirect - this will happen at request time, not during static generation
  redirect('/home');
}

