interface PlaceholderImageProps {
  label: string;
  className?: string;
}

export function PlaceholderImage({ label, className = "" }: PlaceholderImageProps) {
  return (
    <div className={`ph flex items-end justify-center p-5 ${className}`}>
      <span className="text-[11px] uppercase tracking-[0.14em] text-on-surface-variant/70 text-center">
        {label}
      </span>
    </div>
  );
}
