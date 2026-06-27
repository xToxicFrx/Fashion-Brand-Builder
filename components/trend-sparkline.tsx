'use client';

import { Line, LineChart, ResponsiveContainer, YAxis } from 'recharts';

/** Tiny inline trend line (no axes/labels) for cards and teasers. */
export function TrendSparkline({
  data,
  className,
}: {
  data: { date: string; value: number }[];
  className?: string;
}) {
  if (!data || data.length === 0) return null;
  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
          <YAxis hide domain={[0, 100]} />
          <Line
            type="monotone"
            dataKey="value"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
