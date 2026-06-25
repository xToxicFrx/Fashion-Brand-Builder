import { TrendingUp, Flame, TrendingDown } from 'lucide-react';

import { Badge } from '@/components/ui/badge';

const CONFIG: Record<
  string,
  { label: string; icon: typeof TrendingUp; variant: 'success' | 'warning' | 'destructive' }
> = {
  trending_up: { label: 'Trending up', icon: TrendingUp, variant: 'success' },
  peak: { label: 'At peak', icon: Flame, variant: 'warning' },
  declining: { label: 'Declining', icon: TrendingDown, variant: 'destructive' },
};

export function TrendPrediction({ status }: { status: string }) {
  const config = CONFIG[status] ?? CONFIG.trending_up;
  const Icon = config.icon;
  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}
