import { z } from 'zod';

import { CATEGORY_IDS } from '@/lib/categories';

/**
 * Centralized Zod schemas and the canonical lists of allowed values for our
 * "enum-like" String columns (SQLite has no native enums). API routes and forms
 * import from here so validation rules live in exactly one place.
 */

// --- Allowed value sets -----------------------------------------------------
export const USER_ROLES = ['designer', 'brand', 'customer', 'admin'] as const;
export const SUBSCRIPTION_TIERS = ['free', 'starter', 'pro'] as const;
export const DESIGN_CATEGORIES = [
  'tshirt',
  'hoodie',
  'sweatshirt',
  'jacket',
  'longsleeve',
  'tank',
  'cap',
  'tote',
] as const;
export const DESIGN_STATUSES = ['draft', 'published', 'archived'] as const;
export const ORDER_STATUSES = [
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
] as const;
export const TREND_STATUSES = ['trending_up', 'peak', 'declining'] as const;
export const PRINT_PROVIDERS = [
  'none',
  'printful',
  'printify',
  'teespring',
] as const;

// --- Auth -------------------------------------------------------------------
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const signupSchema = z.object({
  name: z.string().min(2, 'Name is too short').max(80),
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
  role: z.enum(USER_ROLES).default('designer'),
});

// --- Waitlist (landing-page demand test) ------------------------------------
export const WAITLIST_SELLS_ON = [
  'etsy',
  'tiktok',
  'instagram',
  'own_store',
  'nothing_yet',
] as const;

export const waitlistSchema = z.object({
  email: z.string().email(),
  sellsOn: z.enum(WAITLIST_SELLS_ON).optional(),
  source: z.string().max(120).optional(),
});

// --- Trend teaser (public landing-page demo) --------------------------------
export const teaserSchema = z.object({
  keyword: z
    .string()
    .trim()
    .min(2, 'Enter a niche or keyword')
    .max(60, 'Keep it under 60 characters'),
});

// --- Canvas (Design.designData) --------------------------------------------
export const canvasElementSchema = z.object({
  id: z.string(),
  type: z.enum(['text', 'rect', 'circle', 'image']),
  name: z.string().optional(),
  x: z.number(),
  y: z.number(),
  width: z.number().optional(),
  height: z.number().optional(),
  radius: z.number().optional(),
  rotation: z.number().optional(),
  scaleX: z.number().optional(),
  scaleY: z.number().optional(),
  fill: z.string().optional(),
  stroke: z.string().optional(),
  strokeWidth: z.number().optional(),
  opacity: z.number().optional(),
  visible: z.boolean().optional(),
  locked: z.boolean().optional(),
  draggable: z.boolean().optional(),
  // text
  text: z.string().optional(),
  fontSize: z.number().optional(),
  fontFamily: z.string().optional(),
  fontStyle: z.string().optional(),
  align: z.string().optional(),
  // image
  src: z.string().optional(),
});

export const canvasStateSchema = z.object({
  width: z.number().positive(),
  height: z.number().positive(),
  background: z.string(),
  elements: z.array(canvasElementSchema),
});

// --- Designs ----------------------------------------------------------------
export const designCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(120),
  description: z.string().max(2000).optional().nullable(),
  category: z.enum(DESIGN_CATEGORIES).default('tshirt'),
  price: z.number().nonnegative().default(29.99),
  status: z.enum(DESIGN_STATUSES).default('draft'),
  designData: canvasStateSchema,
  mockupImageUrl: z.string().optional().nullable(),
  thumbnailUrl: z.string().optional().nullable(),
});

export const designUpdateSchema = designCreateSchema.partial();

// --- Stores -----------------------------------------------------------------
export const brandColorsSchema = z.object({
  primary: z.string().default('#111827'),
  secondary: z.string().default('#6b7280'),
  accent: z.string().default('#f59e0b'),
});

export const storeSchema = z.object({
  name: z.string().min(1, 'Store name is required').max(120),
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9-]+$/, 'Slug may only contain lowercase letters, numbers and dashes')
    .optional(),
  description: z.string().max(2000).optional().nullable(),
  logoUrl: z.string().optional().nullable(),
  brandColors: brandColorsSchema.partial().optional(),
});

// --- Products ---------------------------------------------------------------
export const productCreateSchema = z.object({
  designId: z.string().min(1),
  sku: z.string().min(1).optional(),
  sizes: z.array(z.string()).min(1, 'Select at least one size'),
  prices: z.record(z.number().nonnegative()),
  inventory: z.record(z.number().int().nonnegative()),
  printProvider: z.enum(PRINT_PROVIDERS).default('none'),
  isPublished: z.boolean().default(false),
});

// --- Orders -----------------------------------------------------------------
export const orderUpdateSchema = z.object({
  status: z.enum(ORDER_STATUSES).optional(),
  trackingNumber: z.string().max(120).optional().nullable(),
});

export const checkoutSchema = z.object({
  storeSlug: z.string().min(1),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        size: z.string().min(1),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1, 'Cart is empty'),
  customerEmail: z.string().email(),
});

// --- Trends & AI ------------------------------------------------------------
export const trendQuerySchema = z.object({
  keyword: z.string().min(1, 'Keyword is required').max(100),
  category: z.string().max(60).optional(),
  geo: z.string().max(10).optional(),
});

export const analyzeSchema = z
  .object({
    designId: z.string().optional(),
    name: z.string().max(120).optional(),
    category: z.string().max(60).optional(),
    description: z.string().max(2000).optional(),
    keyword: z.string().max(100).optional(),
  })
  .refine((v) => v.designId || v.name || v.keyword, {
    message: 'Provide a designId, a name, or a keyword to analyze',
  });

// --- Settings ---------------------------------------------------------------
export const profileUpdateSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  bio: z.string().max(500).optional().nullable(),
  role: z.enum(USER_ROLES).optional(),
  image: z.string().optional().nullable(),
  category: z.enum(CATEGORY_IDS).optional(),
});

// --- Inferred types ---------------------------------------------------------
export type CanvasElement = z.infer<typeof canvasElementSchema>;
export type CanvasState = z.infer<typeof canvasStateSchema>;
export type DesignCreateInput = z.infer<typeof designCreateSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type StoreInput = z.infer<typeof storeSchema>;
export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
