import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

import { prisma } from '@/lib/db';
import { signupSchema } from '@/lib/validations';
import { track } from '@/lib/analytics';
import { rateLimit, clientIp } from '@/lib/ratelimit';

/** Create a new user with a hashed password (Credentials-provider sign-up). */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
        { status: 400 },
      );
    }

    const { name, email, password, role } = parsed.data;

    if (!(await rateLimit(`signup:${clientIp(request)}`, 10, 60 * 60 * 1000))) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        { status: 429 },
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 409 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, hashedPassword, role },
    });
    await track('signup', { userId: user.id, meta: { role } });

    return NextResponse.json({ id: user.id, email: user.email });
  } catch (error) {
    console.error('[api/auth/signup]', error);
    return NextResponse.json(
      { error: 'Something went wrong creating your account.' },
      { status: 500 },
    );
  }
}
