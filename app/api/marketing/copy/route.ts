import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getCurrentUser } from '@/lib/auth';
import { generateListingCopy, isOpenAIConfigured } from '@/lib/openai';
import { checkQuota } from '@/lib/limits';
import { track } from '@/lib/analytics';

const schema = z.object({
  keyword: z.string().trim().min(2).max(60),
  productTitle: z.string().max(120).optional(),
  description: z.string().max(400).optional(),
});

/** Generate marketing copy for a product/niche. */
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
    const quota = await checkQuota(user.id, 'copy');
    if (!quota.allowed) {
      await track('paywall_hit', {
        userId: user.id,
        meta: { feature: 'copy', used: quota.used, limit: quota.limit },
      });
      return NextResponse.json(
        {
          error: `You've used all ${quota.limit} copy generations this month — upgrade at /pricing for more, or wait until the 1st.`,
        },
        { status: 429 },
      );
    }

    const copy = await generateListingCopy(parsed.data);
    await track('copy_generated', {
      userId: user.id,
      keyword: parsed.data.keyword,
    });
    return NextResponse.json({ copy });
  } catch (error) {
    console.error('[api/marketing/copy]', error);
    return NextResponse.json(
      { error: 'Could not generate copy. Please try again.' },
      { status: 502 },
    );
  }
}
