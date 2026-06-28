import { NextResponse } from 'next/server';

/**
 * Shared API-route helpers for consistent error handling. The build → ship →
 * verify loop leans on Vercel runtime logs to self-correct, so every route
 * should log failures with a stable, greppable `[scope]` prefix and return a
 * uniform `{ error }` shape. New routes (Phase B onward) use these by default.
 */

/** Uniform JSON error response: `{ error: message }` with an HTTP status. */
export function jsonError(message: string, status = 500): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/** Consistent server-side error log. `scope` is the route, e.g. "api/trends/report". */
export function logError(scope: string, error: unknown): void {
  console.error(`[${scope}]`, error);
}
