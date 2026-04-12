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
    <section className="py-32 bg-surface">
      <div className="container mx-auto px-6 md:px-10">
        <div className="text-center max-w-2xl mx-auto mb-20">
          <h2 className="text-4xl font-bold text-primary mb-6">
            The Trinity of Care
          </h2>
          <p className="text-on-surface-variant">
            Three pillars of botanical health designed to restore, revive,
            and protect your crown.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {benefits.map((benefit) => (
            <div
              key={benefit.title}
              className="bg-surface-container-low p-12 rounded-lg group hover:bg-surface-container-high transition-all duration-500"
            >
              <span className="material-symbols-outlined text-4xl text-secondary mb-8 block">
                {benefit.icon}
              </span>
              <h3 className="text-2xl font-bold text-primary mb-4">
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
