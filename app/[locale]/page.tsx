'use client';

// This page handles /en, /es, /fr routes
// It redirects to the home page with the locale
// Using client component to avoid next-intl server-side initialization
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LocalePage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to home page (which will use the locale from the layout)
    router.replace('/home');
  }, [router]);
  
  return null;
}

