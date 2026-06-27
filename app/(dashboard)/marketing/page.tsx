import { CopyGenerator } from '@/components/Marketing/CopyGenerator';

export default function MarketingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Marketing copy</h1>
        <p className="text-muted-foreground">
          Generate titles, descriptions, SEO tags, and social hooks for any
          product or niche.
        </p>
      </div>
      <CopyGenerator />
    </div>
  );
}
