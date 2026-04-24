"use client";

import { useEffect, useState } from "react";

interface Confetto {
  id: number;
  left: number;
  delay: number;
  duration: number;
  rotate: number;
  color: string;
  shape: "square" | "circle" | "leaf";
}

const COLORS = ["#384527", "#745b1c", "#ffdc90", "#bccca4", "#c5d5ad", "#4f5d3d"];
const SHAPES: Confetto["shape"][] = ["square", "circle", "leaf"];

export function Celebration() {
  const [confetti, setConfetti] = useState<Confetto[]>([]);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const pieces: Confetto[] = Array.from({ length: 80 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 2.5 + Math.random() * 2,
      rotate: Math.random() * 360,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
    }));
    // Visual-only state — safe to set directly from effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setConfetti(pieces);
    const t = setTimeout(() => setVisible(false), 6000);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[90] pointer-events-none overflow-hidden"
    >
      {/* Center burst message */}
      <div className="absolute inset-0 flex items-center justify-center animate-[popIn_0.5s_cubic-bezier(0.34,1.56,0.64,1)]">
        <div className="bg-surface/95 backdrop-blur-xl px-10 py-8 rounded-2xl shadow-botanical-lg border border-primary/20 text-center max-w-md mx-4">
          <div className="text-6xl mb-3 animate-[bounce_1s_ease_3]">🌿</div>
          <h2 className="font-headline text-3xl font-bold text-primary mb-2">
            Order Placed!
          </h2>
          <p className="text-on-surface-variant text-sm">
            Thank you for choosing ShreyCare Organics.
          </p>
        </div>
      </div>

      {/* Confetti rain */}
      {confetti.map((c) => (
        <div
          key={c.id}
          className="absolute top-[-5%]"
          style={{
            left: `${c.left}%`,
            animation: `fallAndFade ${c.duration}s ease-in ${c.delay}s forwards`,
          }}
        >
          <div
            style={{
              width: c.shape === "leaf" ? 14 : 10,
              height: c.shape === "leaf" ? 20 : 10,
              background: c.color,
              borderRadius:
                c.shape === "circle"
                  ? "50%"
                  : c.shape === "leaf"
                    ? "0 100% 0 100%"
                    : "2px",
              transform: `rotate(${c.rotate}deg)`,
            }}
          />
        </div>
      ))}

      <style>{`
        @keyframes popIn {
          0% { transform: scale(0.6); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes fallAndFade {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}
