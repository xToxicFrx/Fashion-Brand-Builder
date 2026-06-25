import type { LucideIcon } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';

export interface QuickStat {
  label: string;
  value: string;
  icon: LucideIcon;
  hint?: string;
}

export function QuickStats({ items }: { items: QuickStat[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label}>
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className="mt-1 text-2xl font-bold">{item.value}</p>
              {item.hint && (
                <p className="mt-1 text-xs text-muted-foreground">{item.hint}</p>
              )}
            </div>
            <div className="rounded-lg bg-muted p-2.5">
              <item.icon className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
