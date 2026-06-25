import type { DefaultSession } from 'next-auth';

/**
 * Augment NextAuth types so the session/JWT carry our custom user fields
 * (database id, role, subscription tier).
 */
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
      subscriptionTier: string;
    } & DefaultSession['user'];
  }

  interface User {
    role?: string;
    subscriptionTier?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: string;
    subscriptionTier?: string;
  }
}
