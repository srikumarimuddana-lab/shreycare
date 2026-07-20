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
    <section className="py-20 md:py-32 bg-surface-container border-y border-outline-variant">
      <div className="container mx-auto px-6 md:px-10">
        <div className="max-w-3xl mx-auto text-center space-y-8 md:space-y-10">
          <span className="material-symbols-outlined text-4xl md:text-5xl text-secondary block">
            format_quote
          </span>
          <h2 className="text-2xl md:text-4xl font-headline italic font-medium text-primary leading-snug">
            &ldquo;{testimonial.quote}&rdquo;
          </h2>
          <div className="space-y-1">
            <p className="uppercase tracking-[0.14em] font-semibold text-primary text-sm">
              {testimonial.name}
            </p>
            {testimonial.title && (
              <p className="text-xs text-on-surface-variant">{testimonial.title}</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
