import Link from 'next/link';
import { Sparkles, Search, TrendingUp, Wand2 } from 'lucide-react';

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { TrendTeaser } from '@/components/trend-teaser';
import { WaitlistForm } from '@/components/waitlist-form';

const STEPS = [
  {
    icon: Search,
    title: '1. Tell us your niche',
    description:
      'Streetwear, Y2K, cottagecore, anime — whatever you make. Takes 10 seconds.',
  },
  {
    icon: TrendingUp,
    title: '2. AI scores what’s next',
    description:
      'We rank what’s about to sell in your niche — with a demand score and a suggested price.',
  },
  {
    icon: Wand2,
    title: '3. Design the winners',
    description:
      'Skip the guesswork. Spend your time only on designs people are already looking for.',
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
        <nav className="flex items-center gap-4 text-sm">
          <Link
            href="/login"
            className="text-muted-foreground underline-offset-4 hover:underline"
          >
            Log in
          </Link>
          <a
            href="#waitlist"
            className="text-muted-foreground underline-offset-4 hover:underline"
          >
            Get early access
          </a>
        </nav>
      </header>

      {/* Hero + live teaser */}
      <section className="mx-auto flex w-full max-w-3xl flex-col items-center px-6 pt-24 pb-16 text-center">
        <span className="mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" /> AI trend intelligence for fashion
          designers
        </span>
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          Know what to design
          <br />
          <span className="text-primary">before</span> you make it.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          Stop guessing. Type your niche and see what’s about to trend — then
          design only the winners.
        </p>
        <div className="mt-8 flex w-full flex-col items-center">
          <TrendTeaser />
          <Link
            href="#waitlist"
            className="mt-4 text-sm text-muted-foreground underline underline-offset-4"
          >
            Or just join the waitlist →
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto grid w-full max-w-5xl gap-6 px-6 pb-20 md:grid-cols-3">
        {STEPS.map((step) => (
          <Card key={step.title}>
            <CardHeader>
              <step.icon className="mb-2 h-8 w-8 text-primary" />
              <CardTitle className="text-xl">{step.title}</CardTitle>
              <CardDescription>{step.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>

      {/* Waitlist */}
      <section
        id="waitlist"
        className="mx-auto w-full max-w-2xl scroll-mt-16 px-6 pb-24 text-center"
      >
        <h2 className="text-2xl font-bold">
          Most indie designs flop. Yours don’t have to.
        </h2>
        <p className="mt-4 text-muted-foreground">
          The designers who sell out aren’t more talented — they just make what’s
          already trending. Get a weekly trend report for your niche.
        </p>
        <div className="mt-8 flex justify-center">
          <WaitlistForm />
        </div>
      </section>

      <footer className="mt-auto border-t px-6 py-6 text-center text-sm text-muted-foreground">
        Fashion Brand Builder — early access.
      </footer>
    </main>
  );
}
