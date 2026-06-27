import { OnboardingWizard } from '@/components/Onboarding/OnboardingWizard';

export const dynamic = 'force-dynamic';

export default function OnboardingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Set up your Trend Radar</h1>
        <p className="text-muted-foreground">
          Tell us what you design — we&apos;ll start tracking it and show you what
          to make next.
        </p>
      </div>
      <OnboardingWizard />
    </div>
  );
}
