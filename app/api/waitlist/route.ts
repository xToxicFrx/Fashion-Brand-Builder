import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { waitlistSchema } from '@/lib/validations';

/**
 * Capture a waitlist signup (email + optional context) to gauge demand for the
 * AI trend tool. Idempotent: a repeat email is treated as success so the
 * visitor is never blocked.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = waitlistSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
        { status: 400 },
      );
    }

    const { email, sellsOn, source } = parsed.data;

    const existing = await prisma.waitlistSignup.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ ok: true, alreadyJoined: true });
    }

    await prisma.waitlistSignup.create({ data: { email, sellsOn, source } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[api/waitlist]', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 },
    );
  }
}
