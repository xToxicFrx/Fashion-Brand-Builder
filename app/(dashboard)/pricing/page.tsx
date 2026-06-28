import { getCurrentUser } from '@/lib/auth';
import { getPlans, isStripeConfigured } from '@/lib/stripe';
import { Plans } from '@/components/Pricing/Plans';
import { MarginCalculator } from '@/components/Pricing/MarginCalculator';

export const metadata = { title: 'Plans & pricing' };
export const dynamic = 'force-dynamic';

export default async function PricingPage() {
  const user = await getCurrentUser();
  const plans = getPlans().map((p) => ({
    id: p.id,
    name: p.name,
    priceLabel: p.priceLabel,
    highlights: p.highlights,
    available: Boolean(p.priceId),
  }));

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold">Plans</h1>
        <p className="text-muted-foreground">
          Start free. Upgrade when you need more reports, briefs and mockups.
        </p>
      </div>

      <Plans
        plans={plans}
        currentTier={user?.subscriptionTier ?? 'free'}
        billingEnabled={isStripeConfigured()}
      />

      <div>
        <h2 className="text-xl font-bold">Pricing &amp; margins</h2>
        <p className="text-muted-foreground">
          Work out your real profit per item and the price you need to hit your
          target margin. (For an AI price suggestion per niche, use the Trend
          Radar.)
        </p>
        <div className="mt-4">
          <MarginCalculator />
        </div>
      </div>
    </div>
  );
}
