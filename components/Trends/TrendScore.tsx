import { cn } from '@/lib/utils';

/** A compact 0-100 trend-strength indicator. */
export function TrendScore({
  score,
  size = 'md',
}: {
  score: number;
  size?: 'sm' | 'md' | 'lg';
}) {
  const color =
    score >= 75
      ? 'text-emerald-600'
      : score >= 50
        ? 'text-amber-600'
        : 'text-rose-600';
  const text =
    size === 'lg' ? 'text-4xl' : size === 'sm' ? 'text-lg' : 'text-2xl';
  return (
    <span className={cn('font-bold tabular-nums', color, text)}>
      {score}
      <span className="text-sm font-normal text-muted-foreground">/100</span>
    </span>
  );
}
