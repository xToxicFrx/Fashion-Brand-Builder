import type { NextAuthOptions } from 'next-auth';
import { getServerSession } from 'next-auth';
import type { Provider } from 'next-auth/providers/index';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import bcrypt from 'bcryptjs';

import { prisma } from '@/lib/db';
import { loginSchema } from '@/lib/validations';

/**
 * Build the provider list. Google is only enabled when its credentials are
 * present, so the app boots without them. The Credentials provider works against
 * the local database immediately (email + bcrypt password).
 */
function buildProviders(): Provider[] {
  const providers: Provider[] = [];

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.push(
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      }),
    );
  }

  providers.push(
    CredentialsProvider({
      name: 'Email & Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });
        if (!user || !user.hashedPassword) return null;

        const valid = await bcrypt.compare(
          parsed.data.password,
          user.hashedPassword,
        );
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          subscriptionTier: user.subscriptionTier,
        };
      },
    }),
  );

  return providers;
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  // JWT strategy is required for the Credentials provider.
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: buildProviders(),
  callbacks: {
    async jwt({ token, user }) {
      // On sign-in, copy db fields onto the token.
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? 'designer';
        token.subscriptionTier =
          (user as { subscriptionTier?: string }).subscriptionTier ?? 'free';
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? '';
        session.user.role = (token.role as string) ?? 'designer';
        session.user.subscriptionTier =
          (token.subscriptionTier as string) ?? 'free';
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

/** Convenience helper: get the current server session. */
export function getSession() {
  return getServerSession(authOptions);
}

/** Convenience helper: get the current user (or null). */
export async function getCurrentUser() {
  const session = await getSession();
  return session?.user ?? null;
}

/** True when Google OAuth login is configured. */
export function isGoogleAuthEnabled(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
  );
}
