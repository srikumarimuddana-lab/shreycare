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
    <Link
      href={`/products/${slug}`}
      className="group block bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden hover:-translate-y-1.5 hover:shadow-botanical transition-all duration-500"
    >
      <div className="aspect-square bg-surface-container-lowest relative">
        <Image
          src={imageUrl}
          alt={name}
          fill
          className="object-contain p-3 md:p-4 group-hover:scale-105 transition-transform duration-700"
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 50vw, 25vw"
        />
        {tag && (
          <div className="absolute top-3 left-3">
            <span className="bg-primary text-on-primary text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full font-semibold">
              {tag}
            </span>
          </div>
        )}
      </div>
      <div className="p-4 md:p-5">
        <h3 className="text-lg md:text-xl lg:text-2xl font-headline font-semibold text-primary leading-tight">{name}</h3>
        {subtitle && <p className="hidden md:block text-on-surface-variant text-sm mt-1 line-clamp-2">{subtitle}</p>}
        <p className="text-secondary font-semibold text-lg md:text-xl lg:text-2xl mt-2 md:mt-4 font-headline">
          ${price.toFixed(2)} CAD
        </p>
      </div>
    </Link>
  );
}
