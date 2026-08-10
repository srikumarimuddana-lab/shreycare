const items = [
  { icon: "eco", label: "Ayurvedic-Inspired" },
  { icon: "cruelty_free", label: "Cruelty-Free" },
  { icon: "science", label: "Zero Additives" },
  { icon: "water_drop", label: "Handmade in Canada" },
];

export function TrustStrip() {
  return (
    <section className="border-y border-outline-variant bg-surface-container">
      <div className="container mx-auto px-6 md:px-10 py-5 flex flex-wrap items-center justify-center md:justify-between gap-x-8 gap-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg text-primary-container">
              {item.icon}
            </span>
            <span className="text-xs md:text-sm font-medium tracking-tight text-on-surface-variant whitespace-nowrap">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
