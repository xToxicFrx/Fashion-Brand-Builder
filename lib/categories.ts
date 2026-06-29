// Curated product categories. Each carries the prompt "vocabulary" that steers
// the AI (trend analysis, design ideas, briefs, mockups, marketing copy) so the
// same engine produces output tailored to the maker's vertical — not just
// fashion. Pure data + helpers, safe to import in client components.

export const CATEGORY_IDS = [
  'fashion',
  'home',
  'jewelry',
  'pod',
  'beauty',
] as const;

export type CategoryId = (typeof CATEGORY_IDS)[number];

export const DEFAULT_CATEGORY: CategoryId = 'fashion';

export interface Category {
  id: CategoryId;
  label: string;
  emoji: string;
  /** One-line description shown in the picker. */
  tagline: string;
  /** Example niches shown in the UI to prime the user. */
  examples: string[];
  // --- Prompt vocabulary (terse; injected into AI system/user prompts) -------
  /** Analyst persona, e.g. "fashion trend analyst for an independent-apparel platform". */
  analyst: string;
  /** The maker the tool serves, e.g. "independent apparel designer". */
  maker: string;
  /** Singular product noun, e.g. "garment", "home decor product". */
  product: string;
  /** Design-director persona for briefs. */
  designDirector: string;
  /** Copywriter persona for marketing copy. */
  copywriter: string;
  /** Default audience fallback. */
  audience: string;
  /** What a single design idea should name (steers idea titles). */
  ideaFocus: string;
  /** Concrete "key elements" guidance for ideas/briefs. */
  elements: string;
  /** Prefix for the image-generation prompt (sets the mockup style). */
  mockupPrefix: string;
}

export const CATEGORIES: Category[] = [
  {
    id: 'fashion',
    label: 'Fashion & Apparel',
    emoji: '👕',
    tagline: 'Clothing, streetwear, graphic tees and apparel.',
    examples: ['streetwear', 'Y2K', 'cottagecore', 'gorpcore'],
    analyst: 'fashion trend analyst for an independent-apparel platform',
    maker: 'independent apparel designer',
    product: 'apparel garment',
    designDirector: 'apparel design director briefing a small brand',
    copywriter: 'fashion e-commerce copywriter',
    audience: 'independent fashion shoppers',
    ideaFocus: 'the specific garment + graphic/visual concept',
    elements: 'motifs, colors, placement, technique',
    mockupPrefix:
      'Apparel product mockup, e-commerce catalog style, clean studio background, photorealistic.',
  },
  {
    id: 'home',
    label: 'Home & Living',
    emoji: '🛋️',
    tagline: 'Decor, textiles, wall art, ceramics and homeware.',
    examples: ['boho wall art', 'scandi ceramics', 'tufted rugs', 'soy candles'],
    analyst: 'home & living trend analyst for independent makers',
    maker: 'independent home-decor maker',
    product: 'home decor product',
    designDirector: 'home & living design director briefing a small studio',
    copywriter: 'home & living e-commerce copywriter',
    audience: 'design-conscious home shoppers',
    ideaFocus: 'the specific homeware item + material/visual concept',
    elements: 'materials, palette, motif, finish',
    mockupPrefix:
      'Home decor product photo, styled interior setting, natural light, photorealistic.',
  },
  {
    id: 'jewelry',
    label: 'Jewelry & Accessories',
    emoji: '💍',
    tagline: 'Jewelry, bags, hats and small accessories.',
    examples: ['gold vermeil', 'beaded necklaces', 'charm jewelry', 'hair claws'],
    analyst: 'jewelry & accessories trend analyst for independent makers',
    maker: 'independent jewelry maker',
    product: 'piece of jewelry or accessory',
    designDirector: 'jewelry design director briefing a small studio',
    copywriter: 'jewelry & accessories e-commerce copywriter',
    audience: 'shoppers seeking distinctive accessories',
    ideaFocus: 'the specific piece + material/silhouette concept',
    elements: 'materials, stones, finish, silhouette',
    mockupPrefix:
      'Jewelry product photo, macro detail, soft studio lighting, clean background, photorealistic.',
  },
  {
    id: 'pod',
    label: 'Print-on-Demand',
    emoji: '🖼️',
    tagline: 'Graphic tees, posters, mugs, stickers and prints.',
    examples: [
      'funny cat shirts',
      'retro posters',
      'motivational mugs',
      'meme stickers',
    ],
    analyst: 'print-on-demand trend analyst for independent sellers',
    maker: 'independent print-on-demand seller',
    product: 'print-on-demand product',
    designDirector: 'graphic design director briefing a print-on-demand seller',
    copywriter: 'print-on-demand e-commerce copywriter',
    audience: 'online shoppers browsing graphic products',
    ideaFocus: 'the product + the specific graphic/slogan concept',
    elements: 'graphic concept, slogan, style, color',
    mockupPrefix:
      'Print-on-demand product mockup, clean studio background, photorealistic.',
  },
  {
    id: 'beauty',
    label: 'Beauty & Cosmetics',
    emoji: '💄',
    tagline: 'Skincare, cosmetics, fragrance and self-care.',
    examples: ['lip oils', 'glass-skin serum', 'solid perfume', 'body butter'],
    analyst: 'beauty & cosmetics trend analyst for indie brands',
    maker: 'independent beauty brand founder',
    product: 'beauty or cosmetics product',
    designDirector: 'beauty brand creative director briefing a small brand',
    copywriter: 'beauty e-commerce copywriter',
    audience: 'beauty shoppers seeking indie products',
    ideaFocus: 'the specific product + formulation/packaging concept',
    elements: 'format, key ingredients, packaging, shade/scent',
    mockupPrefix:
      'Beauty product packaging photo, clean studio background, soft light, photorealistic.',
  },
];

const BY_ID = new Map<string, Category>(CATEGORIES.map((c) => [c.id, c]));

export function isCategoryId(value: unknown): value is CategoryId {
  return typeof value === 'string' && BY_ID.has(value);
}

/** Resolve a category by id, falling back to the default (fashion). */
export function getCategory(id?: string | null): Category {
  return (id && BY_ID.get(id)) || BY_ID.get(DEFAULT_CATEGORY)!;
}
