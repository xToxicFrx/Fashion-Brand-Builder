import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { stringifyJson } from '@/lib/json';
import { track } from '@/lib/analytics';
import {
  getTrendReport,
  persistReportArtifacts,
} from '@/lib/trend-intelligence';

/** Get the current user's onboarding profile (or null). */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const profile = await prisma.onboardingProfile.findUnique({
    where: { userId: user.id },
  });
  return NextResponse.json({ profile });
}

const schema = z.object({
  niches: z.array(z.string().trim().min(1).max(60)).max(8).default([]),
  style: z.string().max(120).optional(),
  goals: z.array(z.string().max(60)).max(8).default([]),
  brandName: z.string().max(80).optional(),
});

/** Save onboarding + auto-track the chosen niches so the radar is populated. */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 },
    );
  }
  const { niches, style, goals, brandName } = parsed.data;

  await prisma.onboardingProfile.upsert({
    where: { userId: user.id },
    update: {
      niches: stringifyJson(niches),
      style: style ?? null,
      goals: stringifyJson(goals),
      brandName: brandName ?? null,
      completed: true,
    },
    create: {
      userId: user.id,
      niches: stringifyJson(niches),
      style: style ?? null,
      goals: stringifyJson(goals),
      brandName: brandName ?? null,
      completed: true,
    },
  });

  // Auto-track the chosen niches so the dashboard has data immediately.
  for (const keyword of niches.slice(0, 8)) {
    await prisma.trackedNiche
      .upsert({
        where: { userId_keyword: { userId: user.id, keyword } },
        update: {},
        create: { userId: user.id, keyword },
      })
      .catch(() => {});
  }

  // Seed the first niche so the dashboard lands with a real score, a saved
  // report and instant ideas — the new user's first "aha". Best-effort.
  const firstNiche = niches[0];
  if (firstNiche) {
    try {
      const report = await getTrendReport(firstNiche, { includeIdeas: true });
      await persistReportArtifacts(user.id, report);
    } catch (e) {
      console.error('[api/onboarding] seed first niche failed', e);
    }
  }

  await track('onboarding_complete', {
    userId: user.id,
    meta: { niches: niches.length, goals: goals.length },
  });

  return NextResponse.json({ ok: true });
}
