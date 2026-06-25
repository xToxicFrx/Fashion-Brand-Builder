import Link from 'next/link';

import { formatCurrency } from '@/lib/utils';

interface ProductCardProps {
  storeSlug: string;
  productId: string;
  name: string;
  image?: string | null;
  price: number;
}

export function ProductCard({
  storeSlug,
  productId,
  name,
  image,
  price,
}: ProductCardProps) {
  return (
    <Link
      href={`/${storeSlug}/${productId}`}
      className="group overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-md"
    >
      <div className="flex aspect-square items-center justify-center bg-muted">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={name}
            className="h-full w-full object-contain transition-transform group-hover:scale-105"
          />
        ) : (
          <span className="text-sm text-muted-foreground">No image</span>
        )}
      </div>
      <div className="p-4">
        <p className="truncate font-medium">{name}</p>
        <p className="text-sm text-muted-foreground">
          from {formatCurrency(price)}
        </p>
      </div>
    </Link>
  );
}
