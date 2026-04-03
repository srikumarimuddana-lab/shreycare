const benefits = [
  {
    icon: "🌿",
    title: "Lush Growth",
    description:
      "Infused with rosemary and bhringraj to stimulate the follicle and encourage thicker, fuller hair cycles.",
  },
  {
    icon: "✨",
    title: "Mirror Shine",
    description:
      "Argan and Camellia oils smooth the cuticle for a weightless, light-reflecting finish that never feels greasy.",
  },
  {
    icon: "🛡️",
    title: "True Strength",
    description:
      "Amla and Vitamin E work to fortify the hair shaft from within, preventing breakage and split ends.",
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
            Three pillars of botanical health designed to restore, rejuvenate,
            and protect your crown.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {benefits.map((benefit) => (
            <div
              key={benefit.title}
              className="bg-surface-container-low p-12 rounded-lg group hover:bg-surface-container-high transition-all duration-500"
            >
              <div className="text-4xl mb-8">{benefit.icon}</div>
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
