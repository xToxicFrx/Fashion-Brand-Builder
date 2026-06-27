'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface Idea {
  title: string;
  description: string;
  suggestedPrice: number;
  keyElements: string[];
  keyword: string;
  trendScore: number;
  momentum: string;
}

export function WhatToDesignNext() {
  const [ideas, setIdeas] = useState<Idea[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch('/api/trends/ideas')
      .then((r) => r.json())
      .then((j) => {
        if (active) setIdeas(j.ideas ?? []);
      })
      .catch(() => {
        if (active) setIdeas([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Finding your best
        opportunities…
      </div>
    );
  }
  if (!ideas || ideas.length === 0) return null;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {ideas.slice(0, 6).map((idea, i) => (
        <Card key={i} className="flex flex-col">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs">
              {idea.keyword} · score {idea.trendScore}
            </CardDescription>
            <CardTitle className="text-base">{idea.title}</CardTitle>
          </CardHeader>
          <CardContent className="mt-auto space-y-2">
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {idea.description}
            </p>
            <span className="text-sm font-semibold">${idea.suggestedPrice}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
