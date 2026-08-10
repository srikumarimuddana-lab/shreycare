const benefits = [
  {
    icon: "eco",
    title: "Healthy Hair Growth",
    description:
      "A powerful blend of nourishing oils and herbal ingredients designed to support scalp care, reduce the appearance of hair fall, and promote fuller-looking, healthier hair.",
  },
  {
    icon: "flare",
    title: "Radiant Shine",
    description:
      "A nourishing mix that helps improve dry, dull hair, smooth strands, restore softness, and enhance natural shine.",
  },
  {
    icon: "shield_with_heart",
    title: "Deep Strength",
    description:
      "Rich ingredients help strengthen hair, reduce the appearance of breakage, support thinning hair concerns, and improve the look of hair volume over time.",
  },
];

export function BenefitsTrinity() {
  return (
    <section className="py-20 md:py-32 bg-surface">
      <div className="container mx-auto px-6 md:px-10">
        <div className="text-center max-w-2xl mx-auto mb-14 md:mb-20">
          <p className="text-xs uppercase tracking-[0.14em] text-secondary font-semibold mb-4">
            Why Choose Shreycare?
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-headline font-medium text-primary leading-tight">
            Targeted Care. Powerful Ingredients. &amp; Healthier-Looking Hair.
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
