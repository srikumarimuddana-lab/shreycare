import type { Testimonial as TestimonialType } from "@/types";

interface TestimonialProps {
  testimonial?: TestimonialType;
}

const defaultTestimonial: TestimonialType = {
  quote:
    "Since incorporating Shrey Care into my weekly ritual, my hair feels like silk. It's not just an oil, it's a moment of profound self-care that I look forward to every single day.",
  name: "Elena Rodriguez",
  title: "Architect & Creative Director",
};

export function Testimonial({
  testimonial = defaultTestimonial,
}: TestimonialProps) {
  return (
    <section className="py-32 bg-primary text-on-primary relative overflow-hidden">
      <div className="container mx-auto px-6 md:px-10 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          <div className="text-6xl text-secondary">&ldquo;</div>
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
