import Link from 'next/link';
import {
  Sparkles,
  Search,
  TrendingUp,
  Wand2,
  ArrowUpRight,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
      'We read search & social trends and rank what’s about to sell — with a demand score and a suggested price.',
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
        <Link
          href="/login"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          See the prototype
        </Link>
      </header>

      {/* Hero */}
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
          Stop guessing. Our AI tells independent fashion designers which designs
          and products are about to trend — so every drop actually sells.
        </p>
        <div className="mt-8 flex w-full justify-center">
          <WaitlistForm />
        </div>
      </section>

      {/* Example trend teaser */}
      <section className="mx-auto w-full max-w-3xl px-6 pb-20">
        <Card className="border-primary/30">
          <CardHeader>
            <CardDescription className="flex items-center gap-2 text-primary">
              <TrendingUp className="h-4 w-4" /> This week’s rising trend
            </CardDescription>
            <CardTitle className="text-2xl">“Y2K baby tees”</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div>
              <p className="text-2xl font-bold">87<span className="text-sm text-muted-foreground">/100</span></p>
              <p className="text-muted-foreground">Trend score</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">↑ Rising</p>
              <p className="text-muted-foreground">Momentum</p>
            </div>
            <div>
              <p className="text-2xl font-bold">High</p>
              <p className="text-muted-foreground">Est. demand</p>
            </div>
            <div>
              <p className="text-2xl font-bold">$28</p>
              <p className="text-muted-foreground">Suggested price</p>
            </div>
          </CardContent>
        </Card>
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Example output. Join the waitlist to get live trends for your niche.
        </p>
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

      {/* Why */}
      <section className="mx-auto w-full max-w-2xl px-6 pb-24 text-center">
        <h2 className="text-2xl font-bold">Most indie designs flop. Yours don’t have to.</h2>
        <p className="mt-4 text-muted-foreground">
          The designers who sell out aren’t more talented — they just make what’s
          already trending. Now you can see it too, before you spend hours
          creating.
        </p>
        <div className="mt-8 flex justify-center">
          <WaitlistForm />
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          Want to poke around the early prototype?{' '}
          <Link href="/login" className="inline-flex items-center gap-1 underline underline-offset-4">
            Open the demo <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </p>
      </section>

      <footer className="mt-auto border-t px-6 py-6 text-center text-sm text-muted-foreground">
        Fashion Brand Builder — early access.
      </footer>
    </main>
  );
}
