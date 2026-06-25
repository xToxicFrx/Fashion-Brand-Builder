/**
 * Database seed — creates a demo designer, store, designs (with sample canvas
 * state), products, trends, reviews, and orders so every page shows real data
 * on first run.
 *
 * Run with: `npm run seed` (after `prisma migrate dev`).
 * Demo login -> email: demo@example.com  password: password
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

/** Build a sample Konva canvas state (stored JSON-encoded in Design.designData). */
function sampleCanvas(opts: {
  bg: string;
  blockColor: string;
  headline: string;
  headlineColor: string;
  sub: string;
}) {
  return {
    width: 500,
    height: 600,
    background: opts.bg,
    elements: [
      {
        id: randomUUID(),
        type: 'rect',
        name: 'Backdrop',
        x: 60,
        y: 70,
        width: 380,
        height: 460,
        fill: opts.blockColor,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        draggable: true,
      },
      {
        id: randomUUID(),
        type: 'circle',
        name: 'Accent dot',
        x: 250,
        y: 180,
        radius: 70,
        fill: opts.headlineColor,
        opacity: 0.25,
        rotation: 0,
        visible: true,
        locked: false,
        draggable: true,
      },
      {
        id: randomUUID(),
        type: 'text',
        name: 'Headline',
        x: 90,
        y: 260,
        width: 320,
        text: opts.headline,
        fontSize: 56,
        fontFamily: 'Arial',
        fontStyle: 'bold',
        align: 'center',
        fill: opts.headlineColor,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
        draggable: true,
      },
      {
        id: randomUUID(),
        type: 'text',
        name: 'Subtitle',
        x: 90,
        y: 360,
        width: 320,
        text: opts.sub,
        fontSize: 22,
        fontFamily: 'Arial',
        fontStyle: 'normal',
        align: 'center',
        fill: opts.headlineColor,
        rotation: 0,
        opacity: 0.85,
        visible: true,
        locked: false,
        draggable: true,
      },
    ],
  };
}

async function main() {
  console.log('🌱 Seeding database...');

  // Clean slate (idempotent re-runs). Order respects FKs; cascades handle the rest.
  await prisma.collaboration.deleteMany();
  await prisma.review.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.design.deleteMany();
  await prisma.store.deleteMany();
  await prisma.trend.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash('password', 10);

  const designer = await prisma.user.create({
    data: {
      name: 'Demo Designer',
      email: 'demo@example.com',
      hashedPassword,
      role: 'designer',
      subscriptionTier: 'pro',
      bio: 'Independent streetwear designer building bold, trend-driven drops.',
      image: 'https://api.dicebear.com/7.x/initials/svg?seed=Demo%20Designer',
    },
  });

  const customer = await prisma.user.create({
    data: {
      name: 'Sam Customer',
      email: 'customer@example.com',
      hashedPassword,
      role: 'customer',
      subscriptionTier: 'free',
    },
  });

  const store = await prisma.store.create({
    data: {
      userId: designer.id,
      name: 'Wildchild Studio',
      slug: 'wildchild',
      description: 'Bold streetwear for people who refuse to blend in.',
      logoUrl: 'https://api.dicebear.com/7.x/shapes/svg?seed=Wildchild',
      brandColors: JSON.stringify({
        primary: '#111827',
        secondary: '#f59e0b',
        accent: '#ef4444',
      }),
      subscriptionTier: 'pro',
    },
  });

  const designSpecs = [
    {
      name: 'Stay Wild Tee',
      description: 'Heavyweight cotton tee with a bold statement print.',
      category: 'tshirt',
      price: 32,
      trendScore: 87,
      demandPrediction: 640,
      status: 'published',
      canvas: sampleCanvas({
        bg: '#f9fafb',
        blockColor: '#111827',
        headline: 'STAY WILD',
        headlineColor: '#f59e0b',
        sub: 'EST. 2026 — WILDCHILD',
      }),
    },
    {
      name: 'Midnight Hoodie',
      description: 'Oversized fleece hoodie, perfect for the gorpcore wave.',
      category: 'hoodie',
      price: 64,
      trendScore: 73,
      demandPrediction: 410,
      status: 'published',
      canvas: sampleCanvas({
        bg: '#0f172a',
        blockColor: '#1e293b',
        headline: 'MIDNIGHT',
        headlineColor: '#38bdf8',
        sub: 'AFTER HOURS COLLECTION',
      }),
    },
    {
      name: 'Y2K Crop',
      description: 'Cropped baby tee riding the Y2K revival trend.',
      category: 'tshirt',
      price: 28,
      trendScore: 91,
      demandPrediction: 820,
      status: 'published',
      canvas: sampleCanvas({
        bg: '#fdf2f8',
        blockColor: '#db2777',
        headline: 'Y2K 4EVER',
        headlineColor: '#fce7f3',
        sub: 'CYBER SWEETHEART',
      }),
    },
    {
      name: 'Cargo Tech Jacket',
      description: 'Utility jacket concept — still in draft.',
      category: 'jacket',
      price: 120,
      trendScore: 58,
      demandPrediction: 180,
      status: 'draft',
      canvas: sampleCanvas({
        bg: '#ecfccb',
        blockColor: '#3f6212',
        headline: 'TECH CARGO',
        headlineColor: '#ecfccb',
        sub: 'UTILITY DIVISION',
      }),
    },
  ];

  const designs = [];
  for (const spec of designSpecs) {
    const design = await prisma.design.create({
      data: {
        userId: designer.id,
        name: spec.name,
        description: spec.description,
        category: spec.category,
        price: spec.price,
        trendScore: spec.trendScore,
        demandPrediction: spec.demandPrediction,
        status: spec.status,
        designData: JSON.stringify(spec.canvas),
        mockupImageUrl: `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(
          spec.name,
        )}`,
        thumbnailUrl: `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(
          spec.name,
        )}`,
      },
    });
    designs.push(design);
  }

  // Products for the first three (published) designs.
  const sizes = ['S', 'M', 'L', 'XL'];
  const products = [];
  for (let i = 0; i < 3; i++) {
    const design = designs[i];
    const prices: Record<string, number> = {};
    const inventory: Record<string, number> = {};
    for (const s of sizes) {
      prices[s] = design.price;
      inventory[s] = 25 + i * 10;
    }
    const product = await prisma.product.create({
      data: {
        designId: design.id,
        storeId: store.id,
        sku: `WC-${design.category.toUpperCase().slice(0, 3)}-${1000 + i}`,
        sizes: JSON.stringify(sizes),
        prices: JSON.stringify(prices),
        inventory: JSON.stringify(inventory),
        printProvider: 'printful',
        isPublished: true,
      },
    });
    products.push(product);
  }

  // Trends, linked to relevant designs.
  const trendSpecs = [
    {
      keyword: 'y2k fashion',
      category: 'tshirt',
      trendScore: 91,
      predictionStatus: 'trending_up',
      tiktokEngagement: 1850000,
      redditSentiment: 0.62,
      link: [designs[2]],
    },
    {
      keyword: 'oversized hoodie',
      category: 'hoodie',
      trendScore: 78,
      predictionStatus: 'peak',
      tiktokEngagement: 990000,
      redditSentiment: 0.41,
      link: [designs[1]],
    },
    {
      keyword: 'gorpcore',
      category: 'jacket',
      trendScore: 64,
      predictionStatus: 'trending_up',
      tiktokEngagement: 540000,
      redditSentiment: 0.55,
      link: [designs[3]],
    },
    {
      keyword: 'graphic tee',
      category: 'tshirt',
      trendScore: 70,
      predictionStatus: 'declining',
      tiktokEngagement: 320000,
      redditSentiment: 0.18,
      link: [designs[0]],
    },
  ];
  for (const t of trendSpecs) {
    await prisma.trend.create({
      data: {
        keyword: t.keyword,
        category: t.category,
        trendScore: t.trendScore,
        predictionStatus: t.predictionStatus,
        tiktokEngagement: t.tiktokEngagement,
        redditSentiment: t.redditSentiment,
        googleTrendsData: JSON.stringify({
          timeline: Array.from({ length: 12 }, (_, idx) => ({
            week: idx + 1,
            value: Math.max(
              5,
              Math.round(t.trendScore * (0.5 + Math.sin(idx / 2) * 0.4)),
            ),
          })),
        }),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        designs: { connect: t.link.map((d) => ({ id: d.id })) },
      },
    });
  }

  // Reviews on published designs by the customer.
  await prisma.review.createMany({
    data: [
      {
        designId: designs[0].id,
        userId: customer.id,
        rating: 5,
        comment: 'The print quality is unreal. Instant favorite.',
      },
      {
        designId: designs[1].id,
        userId: customer.id,
        rating: 4,
        comment: 'Super cozy, runs slightly large.',
      },
      {
        designId: designs[2].id,
        userId: customer.id,
        rating: 5,
        comment: 'Perfect Y2K vibe, got so many compliments.',
      },
    ],
  });

  // A couple of orders across statuses.
  await prisma.order.create({
    data: {
      storeId: store.id,
      customerEmail: 'customer@example.com',
      items: JSON.stringify([
        { productId: products[0].id, quantity: 2, price: 32, size: 'M' },
        { productId: products[2].id, quantity: 1, price: 28, size: 'S' },
      ]),
      totalAmount: 92,
      status: 'shipped',
      trackingNumber: '1Z999AA10123456784',
      shippingAddress: JSON.stringify({
        name: 'Sam Customer',
        line1: '123 Market St',
        city: 'Berlin',
        postalCode: '10115',
        country: 'DE',
      }),
    },
  });
  await prisma.order.create({
    data: {
      storeId: store.id,
      customerEmail: 'another@example.com',
      items: JSON.stringify([
        { productId: products[1].id, quantity: 1, price: 64, size: 'L' },
      ]),
      totalAmount: 64,
      status: 'pending',
      shippingAddress: JSON.stringify({
        name: 'Alex Buyer',
        line1: '9 Rivington St',
        city: 'London',
        postalCode: 'EC2A',
        country: 'GB',
      }),
    },
  });

  console.log('✅ Seed complete.');
  console.log('   Login -> demo@example.com / password');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
