import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getCurrentUser } from '@/lib/auth';
import { generateConceptImage, isOpenAIConfigured } from '@/lib/openai';
import { persistImageFromUrl } from '@/lib/storage';

const schema = z.object({ prompt: z.string().trim().min(3).max(1000) });

/** Generate an AI concept/mockup image for a design idea (authed, paid). */
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
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
        { status: 400 },
      );
    }
    // generateConceptImage returns a temporary dall-e-3 URL (expires after
    // ~1-2h). Copy it into Supabase Storage so saved mockups stay valid; if
    // Storage isn't configured this returns the original URL unchanged.
    const rawUrl = await generateConceptImage(parsed.data.prompt);
    const url = await persistImageFromUrl(rawUrl, user.id);
    return NextResponse.json({ url });
  } catch (error) {
    console.error('[api/design/image]', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Image generation failed.',
      },
      { status: 502 },
    );
  }
}
