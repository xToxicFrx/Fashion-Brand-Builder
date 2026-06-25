import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { analyzeSchema } from '@/lib/validations';
import {
  getDesignSuggestions,
  isClaudeConfigured,
  type DesignSuggestionInput,
} from '@/lib/claude';

/**
 * AI design assistant — returns Claude's trend/price/demand assessment for a
 * design (by id, or by inline name/category/description) or a keyword.
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = analyzeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
        { status: 400 },
      );
    }

    const input: DesignSuggestionInput = { ...parsed.data };

    // Enrich from the stored design when a designId is supplied.
    if (parsed.data.designId) {
      const design = await prisma.design.findUnique({
        where: { id: parsed.data.designId },
      });
      if (design && design.userId === user.id) {
        input.name = design.name;
        input.category = design.category;
        input.description = design.description ?? undefined;
      }
    }

    if (!isClaudeConfigured()) {
      return NextResponse.json(
        {
          error:
            'AI is not configured. Set ANTHROPIC_API_KEY to enable design suggestions.',
        },
        { status: 503 },
      );
    }

    const suggestion = await getDesignSuggestions(input);
    return NextResponse.json({ suggestion });
  } catch (error) {
    console.error('[api/ai/suggestions]', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'AI analysis failed.',
      },
      { status: 502 },
    );
  }
}
