const benefits = [
  {
    icon: "eco",
    title: "Lush Growth",
    description:
      "Infused botanical blend that nourishes roots for fuller, healthier-looking hair growth.",
  },
  {
    icon: "flare",
    title: "Radiant Shine",
    description:
      "Herbal mix that smooths strands and restores natural glossy, mirror-like shine.",
  },
  {
    icon: "shield_with_heart",
    title: "Deep Strength",
    description:
      "Potent plant actives that strengthen hair follicles and help reduce breakage over time.",
  },
];

export function BenefitsTrinity() {
  return (
    <section className="py-20 md:py-32 bg-surface">
      <div className="container mx-auto px-6 md:px-10">
        <div className="text-center max-w-2xl mx-auto mb-14 md:mb-20">
          <p className="text-xs uppercase tracking-[0.14em] text-secondary font-semibold mb-4">
            The Trinity of Care
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-headline font-medium text-primary leading-tight">
            Three pillars to restore, revive &amp; protect your crown.
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-7">
          {benefits.map((benefit) => (
            <div
              key={benefit.title}
              className="bg-surface-container-lowest border border-outline-variant p-9 md:p-11 rounded-lg group hover:-translate-y-1.5 hover:shadow-botanical transition-all duration-500"
            >
              <div className="w-14 h-14 rounded-full bg-surface-container-high flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-2xl text-primary-container">
                  {benefit.icon}
                </span>
              </div>
              <h3 className="text-2xl font-headline font-semibold text-primary mb-3">
                {benefit.title}
              </h3>
              <p className="text-on-surface-variant leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
