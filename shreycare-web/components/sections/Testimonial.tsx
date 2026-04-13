import type { Testimonial as TestimonialType } from "@/types";

interface TestimonialProps {
  testimonial?: TestimonialType;
}

const defaultTestimonial: TestimonialType = {
  quote:
    "Since incorporating ShreyCare Organics into my weekly ritual, my hair feels like silk. It's not just an oil, it's a moment of profound self-care that I look forward to every single day.",
  name: "Bhavana",
  // title: "Founder, ShreyCare Organics",
};

export function Testimonial({
  testimonial = defaultTestimonial,
}: TestimonialProps) {
  return (
    <section className="py-32 bg-primary text-on-primary relative overflow-hidden">
      <div className="absolute top-0 right-0 opacity-10 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
        <span className="material-symbols-outlined text-[40rem]">spa</span>
      </div>
      <div className="container mx-auto px-6 md:px-10 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          <span className="material-symbols-outlined text-6xl text-secondary block">
            format_quote
          </span>
          <h2 className="text-3xl md:text-5xl font-headline italic leading-relaxed">
            &ldquo;{testimonial.quote}&rdquo;
          </h2>
          <div className="space-y-2">
            <p className="uppercase tracking-[0.2em] font-bold text-secondary">
              {testimonial.name}
            </p>
            <p className="text-sm opacity-60">{testimonial.title}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
