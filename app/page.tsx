import Link from 'next/link';
import {
  Palette,
  TrendingUp,
  Store,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const FEATURES = [
  {
    icon: Palette,
    title: 'Design Studio',
    description:
      'A full canvas editor — text, shapes, images, layers, and undo/redo. Save and publish print-ready designs.',
  },
  {
    icon: TrendingUp,
    title: 'Trend Intelligence',
    description:
      'Google Trends data plus Claude-powered analysis to score demand and time your drops.',
  },
  {
    icon: Store,
    title: 'E-Commerce Store',
    description:
      'Turn designs into products, open a branded storefront, and accept payments with Stripe.',
  },
];

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col">
      {/* Nav */}
      <header className="flex items-center justify-between border-b px-6 py-4">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <Sparkles className="h-5 w-5" />
          Fashion Brand Builder
        </Link>
        <nav className="flex items-center gap-2">
          <Button variant="ghost" asChild>
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Get started</Link>
          </Button>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto flex max-w-4xl flex-col items-center px-6 py-24 text-center">
        <span className="mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" /> MVP — Design · Store · Trends
        </span>
        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
          Build your fashion brand,
          <br />
          end to end.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          The all-in-one platform for independent designers: create designs in a
          powerful studio, predict trends with AI, and sell from your own store.
        </p>
        <div className="mt-8 flex gap-3">
          <Button size="lg" asChild>
            <Link href="/signup">
              Start designing <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/login">I have an account</Link>
          </Button>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Demo login: <code className="font-mono">demo@example.com</code> /{' '}
          <code className="font-mono">password</code>
        </p>
      </section>

      {/* Features */}
      <section className="mx-auto grid max-w-5xl gap-6 px-6 pb-24 md:grid-cols-3">
        {FEATURES.map((feature) => (
          <Card key={feature.title}>
            <CardHeader>
              <feature.icon className="mb-2 h-8 w-8" />
              <CardTitle className="text-xl">{feature.title}</CardTitle>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>

      <footer className="mt-auto border-t px-6 py-6 text-center text-sm text-muted-foreground">
        Fashion Brand Builder — Phase 1 MVP.
      </footer>
    </main>
  );
}
