import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth';
import { trendQuerySchema } from '@/lib/validations';
import { getDesignSuggestions, isClaudeConfigured } from '@/lib/claude';

/**
 * Claude-powered trend analysis for a keyword — returns a structured trend
 * score, prediction status, related keywords, and rationale.
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = trendQuerySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid keyword' },
        { status: 400 },
      );
    }

    if (!isClaudeConfigured()) {
      return NextResponse.json(
        {
          error:
            'AI is not configured. Set ANTHROPIC_API_KEY to enable trend analysis.',
        },
        { status: 503 },
      );
    }

    const analysis = await getDesignSuggestions({
      keyword: parsed.data.keyword,
      category: parsed.data.category,
    });

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error('[api/trends/analyze]', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Trend analysis failed.',
      },
      { status: 502 },
    );
  }
}
