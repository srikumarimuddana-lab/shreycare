"use client";

import { useState } from "react";

interface AccordionItemProps {
  question: string;
  children: React.ReactNode;
}

export function AccordionItem({ question, children }: AccordionItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-surface-container-low rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center px-8 py-6 text-left hover:bg-surface-container-high transition-colors"
      >
        <span className="text-primary font-bold text-lg pr-4">{question}</span>
        <span
          className={`text-on-surface-variant transition-transform duration-300 ${
            isOpen ? "rotate-45" : ""
          }`}
        >
          +
        </span>
      </button>
      <div
        className={`grid transition-all duration-300 ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-8 pb-6 text-on-surface-variant leading-relaxed">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
