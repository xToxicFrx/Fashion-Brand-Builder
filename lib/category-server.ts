import { prisma } from '@/lib/db';
import {
  DEFAULT_CATEGORY,
  isCategoryId,
  type CategoryId,
} from '@/lib/categories';

/**
 * Resolve a user's chosen product category from the DB (authoritative — like
 * the subscription tier, it can change after the session JWT was minted, so we
 * read it fresh where it's used). Defaults to fashion and never throws.
 */
export async function getUserCategory(userId: string): Promise<CategoryId> {
  try {
    const u = await prisma.user.findUnique({
      where: { id: userId },
      select: { category: true },
    });
    return isCategoryId(u?.category) ? u!.category : DEFAULT_CATEGORY;
  } catch {
    return DEFAULT_CATEGORY;
  }
}
