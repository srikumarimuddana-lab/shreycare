import Image from "next/image";
import Link from "next/link";

interface ProductCardProps {
  name: string;
  slug: string;
  subtitle?: string;
  price: number;
  imageUrl: string;
  tag?: string;
}

export function ProductCard({
  name,
  slug,
  subtitle,
  price,
  imageUrl,
  tag,
}: ProductCardProps) {
  return (
    <Link href={`/products/${slug}`} className="space-y-6 group block">
      <div className="aspect-[3/4] bg-surface-container rounded-lg overflow-hidden relative">
        <Image
          src={imageUrl}
          alt={name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-700"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
        {tag && (
          <div className="absolute bottom-4 left-4">
            <span className="bg-surface-container-lowest text-[10px] uppercase tracking-widest px-3 py-1 rounded-full text-primary font-bold">
              {tag}
            </span>
          </div>
        )}
      </div>
      <div>
        <h3 className="text-xl font-bold text-primary">{name}</h3>
        {subtitle && <p className="text-on-surface-variant text-sm mt-1 line-clamp-2">{subtitle}</p>}
        <p className="text-secondary font-bold mt-4">
          ${price.toFixed(2)} CAD
        </p>
      </div>
    </Link>
  );
}
