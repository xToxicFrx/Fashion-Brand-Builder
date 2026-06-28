import { MarginCalculator } from '@/components/Pricing/MarginCalculator';

export const metadata = { title: 'Pricing & margins' };

export default function PricingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pricing &amp; margins</h1>
        <p className="text-muted-foreground">
          Work out your real profit per item and the price you need to hit your
          target margin. (For an AI price suggestion per niche, use the Trend
          Radar.)
        </p>
      </div>
      <MarginCalculator />
    </div>
  );
}
