import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getCurrentUser } from '@/lib/auth';
import { generateConceptImage, isOpenAIConfigured } from '@/lib/openai';
import { persistImageFromBase64, persistImageFromUrl } from '@/lib/storage';
import { track } from '@/lib/analytics';
import { jsonError, logError } from '@/lib/api';
import { checkQuota } from '@/lib/limits';
import { getUserCategory } from '@/lib/category-server';

const schema = z.object({ prompt: z.string().trim().min(3).max(1000) });

/** Generate an AI concept/mockup image for a design idea (authed, paid). */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return jsonError('Unauthorized', 401);
    }
    if (!isOpenAIConfigured()) {
      return jsonError('AI is not configured. Set OPENAI_API_KEY.', 503);
    }
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? 'Invalid input', 400);
    }

    const quota = await checkQuota(user.id, 'mockup');
    if (!quota.allowed) {
      await track('paywall_hit', {
        userId: user.id,
        meta: { feature: 'mockup', used: quota.used, limit: quota.limit },
      });
      return jsonError(
        `You've used all ${quota.limit} mockups this month — upgrade at /pricing for more, or wait until the 1st.`,
        429,
      );
    }
    // generateConceptImage returns either a temporary dall-e URL (expires after
    // ~1-2h) or base64 data (gpt-image-1). Either way, copy it into Supabase
    // Storage so saved mockups stay valid; if Storage isn't configured the URL
    // form is returned unchanged and the base64 form becomes an inline data URL.
    const category = await getUserCategory(user.id);
    const image = await generateConceptImage(parsed.data.prompt, category);
    const url =
      'url' in image
        ? await persistImageFromUrl(image.url, user.id)
        : await persistImageFromBase64(image.b64, user.id);
    await track('mockup_generated', { userId: user.id });
    return NextResponse.json({ url });
  } catch (error) {
    logError('api/design/image', error);
    return jsonError('Image generation failed. Please try again.', 502);
  }
}
