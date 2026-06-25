/**
 * Subscription tier limits (Phase 1 monetization). Used to gate resource
 * creation by the current user's subscriptionTier.
 */
export const DESIGN_LIMITS: Record<string, number> = {
  free: 1,
  starter: 10,
  pro: Number.POSITIVE_INFINITY,
};

export const STORE_LIMITS: Record<string, number> = {
  free: 0,
  starter: 1,
  pro: Number.POSITIVE_INFINITY,
};

export function designLimitFor(tier: string): number {
  return DESIGN_LIMITS[tier] ?? DESIGN_LIMITS.free;
}

export function storeLimitFor(tier: string): number {
  return STORE_LIMITS[tier] ?? STORE_LIMITS.free;
}
