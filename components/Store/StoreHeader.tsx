import Link from 'next/link';

interface StoreHeaderProps {
  name: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
  colors?: { primary?: string; secondary?: string; accent?: string };
}

export function StoreHeader({
  name,
  slug,
  description,
  logoUrl,
  colors,
}: StoreHeaderProps) {
  const primary = colors?.primary ?? '#111827';
  return (
    <header
      className="px-6 py-12 text-center text-white"
      style={{ backgroundColor: primary }}
    >
      <Link href={`/${slug}`} className="inline-flex flex-col items-center gap-3">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={name}
            className="h-16 w-16 rounded-full bg-white/10 object-cover"
          />
        ) : null}
        <h1 className="text-3xl font-bold">{name}</h1>
      </Link>
      {description && (
        <p className="mx-auto mt-3 max-w-xl text-sm text-white/80">
          {description}
        </p>
      )}
    </header>
  );
}
