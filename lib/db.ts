import { PrismaClient } from '@prisma/client';

/**
 * Prisma client singleton. In development Next.js hot-reloads modules, which can
 * exhaust DB connections by creating a new client on every reload; caching on
 * globalThis prevents that.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['error', 'warn']
        : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
