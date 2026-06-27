import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getCurrentUser } from '@/lib/auth';
import {
  generateDesignBrief,
  isOpenAIConfigured,
} from '@/lib/openai';

const briefSchema = z.object({
  ideaTitle: z.string().trim().min(2).max(120),
  keyword: z.string().trim().min(2).max(60),
  description: z.string().max(400).optional(),
});

/** Generate a concrete design brief for a trend-driven idea. */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!isOpenAIConfigured()) {
      return NextResponse.json(
        { error: 'AI is not configured. Set OPENAI_API_KEY.' },
        { status: 503 },
      );
    }

    const body = await request.json();
    const parsed = briefSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
        { status: 400 },
      );
    }

    const brief = await generateDesignBrief(parsed.data);
    return NextResponse.json({ brief });
  } catch (error) {
    console.error('[api/trends/brief]', error);
    return NextResponse.json(
      { error: 'Could not generate the brief. Please try again.' },
      { status: 502 },
    );
  }
}
