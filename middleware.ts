import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Defense-in-depth CSRF guard: reject cross-origin state-changing API requests.
 * Layered on top of NextAuth's SameSite=lax cookies (which already block the
 * cross-site case). Exemptions:
 *  - /api/stripe/webhook — signature-verified, server-to-server, no Origin.
 *  - /api/auth/*         — NextAuth has its own CSRF protection.
 * Requests without an Origin header are allowed (non-browser clients can't be
 * tricked by CSRF, which is a browser-only attack).
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (
    !MUTATING.has(req.method) ||
    pathname.startsWith('/api/stripe/webhook') ||
    pathname.startsWith('/api/auth')
  ) {
    return NextResponse.next();
  }

  const origin = req.headers.get('origin');
  if (origin) {
    try {
      if (new URL(origin).host !== req.headers.get('host')) {
        return new NextResponse('Forbidden', { status: 403 });
      }
    } catch {
      return new NextResponse('Forbidden', { status: 403 });
    }
  }
  return NextResponse.next();
}

export const config = { matcher: '/api/:path*' };
