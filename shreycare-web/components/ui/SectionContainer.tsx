type Layer = 0 | 1 | 2 | 3;

interface SectionContainerProps {
  layer?: Layer;
  className?: string;
  children: React.ReactNode;
}

const layerBg: Record<Layer, string> = {
  0: "bg-surface",
  1: "bg-surface-container",
  2: "bg-surface-container-highest",
  3: "bg-surface-container-lowest",
};

export function SectionContainer({
  layer = 0,
  className = "",
  children,
}: SectionContainerProps) {
  return (
    <section className={`py-32 ${layerBg[layer]} ${className}`}>
      <div className="container mx-auto px-6 md:px-10">{children}</div>
    </section>
  );
}
