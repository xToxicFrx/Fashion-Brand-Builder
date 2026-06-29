'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

/**
 * Rendered on /pricing?upgraded=1 right after a successful Stripe Checkout.
 * Confirms the upgrade and refreshes the page a couple of times over a few
 * seconds, in case the Stripe webhook (which writes the new tier to the DB)
 * lands a moment after the redirect — so the new plan shows without a re-login.
 */
export function UpgradeSync() {
  const router = useRouter();
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    toast.success('🎉 Upgrade complete — welcome to your new plan!');
    const t1 = setTimeout(() => router.refresh(), 1500);
    const t2 = setTimeout(() => router.refresh(), 4000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [router]);

  return null;
}
