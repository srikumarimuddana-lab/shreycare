"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { urlFor } from "@/lib/sanity/image";
import type { Product } from "@/types";

interface HairQuizProps {
  products: Product[];
}

const QUESTIONS = [
  {
    question: "What is your main hair concern?",
    options: [
      { label: "Hair fall & thinning", scores: { growth: 3, dandruff: 0, holistic: 0 } },
      { label: "Dandruff & itchy scalp", scores: { growth: 0, dandruff: 3, holistic: 0 } },
      { label: "Dry, dull or frizzy hair", scores: { growth: 0, dandruff: 0, holistic: 3 } },
      { label: "Multiple concerns", scores: { growth: 1, dandruff: 1, holistic: 2 } },
    ],
  },
  {
    question: "How does your scalp usually feel?",
    options: [
      { label: "Oily and greasy", scores: { growth: 0, dandruff: 2, holistic: 1 } },
      { label: "Dry and flaky", scores: { growth: 0, dandruff: 3, holistic: 0 } },
      { label: "Dry but no flakes", scores: { growth: 1, dandruff: 0, holistic: 2 } },
      { label: "Normal, but hair feels weak", scores: { growth: 2, dandruff: 0, holistic: 1 } },
    ],
  },
  {
    question: "What result matters most to you?",
    options: [
      { label: "Regrow & strengthen hair", scores: { growth: 3, dandruff: 0, holistic: 0 } },
      { label: "Clear scalp, stop flakes", scores: { growth: 0, dandruff: 3, holistic: 0 } },
      { label: "Deep nourishment & shine", scores: { growth: 0, dandruff: 0, holistic: 3 } },
      { label: "All of the above", scores: { growth: 1, dandruff: 1, holistic: 2 } },
    ],
  },
];

type ProductKey = "growth" | "dandruff" | "holistic";

function matchProduct(products: Product[], winner: ProductKey): Product | null {
  const keywords: Record<ProductKey, string[]> = {
    growth: ["growth"],
    dandruff: ["dandruff", "anti-dandruff"],
    holistic: ["holistic"],
  };
  const terms = keywords[winner];
  return (
    products.find((p) =>
      terms.some((t) => p.name.toLowerCase().includes(t))
    ) ?? products[0] ?? null
  );
}

export function HairQuiz({ products }: HairQuizProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [recommended, setRecommended] = useState<Product | null>(null);

  const totalSteps = QUESTIONS.length;
  const isLastStep = step === totalSteps - 1;

  function handleSelect(optionIdx: number) {
    setSelected(optionIdx);
  }

  function handleNext() {
    if (selected === null) return;
    const newAnswers = [...answers, selected];

    if (isLastStep) {
      const scores: Record<ProductKey, number> = { growth: 0, dandruff: 0, holistic: 0 };
      newAnswers.forEach((answerIdx, qIdx) => {
        const option = QUESTIONS[qIdx].options[answerIdx];
        (Object.keys(option.scores) as ProductKey[]).forEach((key) => {
          scores[key] += option.scores[key];
        });
      });

      const winner = (Object.keys(scores) as ProductKey[]).reduce(
        (best, key) => (scores[key] > scores[best] ? key : best),
        "holistic" as ProductKey
      );

      setAnswers(newAnswers);
      setRecommended(matchProduct(products, winner));
      setStep(totalSteps);
    } else {
      setAnswers(newAnswers);
      setStep(step + 1);
      setSelected(null);
    }
  }

  function handleRetake() {
    setStep(0);
    setAnswers([]);
    setSelected(null);
    setRecommended(null);
  }

  if (step === totalSteps && recommended) {
    const imageUrl = recommended.images?.[0]
      ? urlFor(recommended.images[0]).width(800).height(1000).url()
      : "/images/placeholder-product.jpg";

    return (
      <div className="max-w-lg mx-auto text-center">
        <p className="text-secondary font-bold uppercase tracking-widest text-xs mb-3">
          Your Perfect Match
        </p>
        <h2 className="font-headline text-3xl md:text-4xl text-primary mb-2">
          We recommend
        </h2>
        <p className="text-on-surface-variant mb-10">
          Based on your answers, this oil is made for you.
        </p>

        <div className="bg-surface-container-low rounded-lg overflow-hidden shadow-botanical-lg mb-8">
          <div className="aspect-[4/5] relative">
            <Image
              src={imageUrl}
              alt={recommended.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 512px"
            />
          </div>
          <div className="p-8 text-left">
            <h3 className="font-headline text-2xl font-bold text-primary mb-2">
              {recommended.name}
            </h3>
            <p className="text-on-surface-variant text-sm mb-4 leading-relaxed">
              {recommended.description}
            </p>
            <p className="text-secondary font-bold text-lg">
              ${recommended.price.toFixed(2)} CAD
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button href={`/products/${recommended.slug}`} variant="primary">
            Shop Now
          </Button>
          <Button variant="secondary" onClick={handleRetake}>
            Retake Quiz
          </Button>
        </div>
      </div>
    );
  }

  const current = QUESTIONS[step];
  const progress = ((step + 1) / totalSteps) * 100;

  return (
    <div className="max-w-xl mx-auto">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between text-xs uppercase tracking-widest text-on-surface-variant mb-3">
          <span>Question {step + 1} of {totalSteps}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <div className="h-1 bg-surface-container-high rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <h2 className="font-headline text-2xl md:text-3xl text-primary mb-8 leading-snug">
        {current.question}
      </h2>

      {/* Options */}
      <div className="space-y-3 mb-10">
        {current.options.map((option, idx) => (
          <button
            key={idx}
            onClick={() => handleSelect(idx)}
            className={`w-full text-left px-6 py-5 rounded-sm transition-all duration-200 border ${
              selected === idx
                ? "bg-primary text-on-primary border-primary"
                : "bg-surface-container-low text-on-surface border-transparent hover:bg-surface-container-high"
            }`}
          >
            <span className="font-body text-base">{option.label}</span>
          </button>
        ))}
      </div>

      {/* CTA */}
      <Button
        variant="primary"
        onClick={handleNext}
        disabled={selected === null}
        className={selected === null ? "opacity-50 cursor-not-allowed" : ""}
      >
        {isLastStep ? "See My Recommendation" : "Next"}
      </Button>
    </div>
  );
}
