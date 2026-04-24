"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type ToastVariant = "info" | "success" | "error";

interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const variantStyles: Record<ToastVariant, { accent: string; icon: string }> = {
  info: { accent: "bg-primary", icon: "info" },
  success: { accent: "bg-green-600", icon: "check_circle" },
  error: { accent: "bg-error", icon: "error" },
};

let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, variant: ToastVariant = "info") => {
      const id = ++toastId;
      setToasts((prev) => [...prev, { id, message, variant }]);
      setTimeout(() => dismiss(id), 4000);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => {
          const style = variantStyles[t.variant];
          return (
            <div
              key={t.id}
              className="pointer-events-auto flex items-stretch bg-surface-container-lowest/95 backdrop-blur-xl rounded-lg shadow-botanical-lg overflow-hidden min-w-[260px] max-w-sm animate-[slideInRight_0.3s_ease-out]"
            >
              <div className={`w-1 ${style.accent}`} />
              <div className="px-4 py-3 flex items-center gap-3 flex-1">
                <span className={`material-symbols-outlined text-xl ${t.variant === "error" ? "text-error" : t.variant === "success" ? "text-green-600" : "text-primary"}`}>
                  {style.icon}
                </span>
                <p className="text-on-surface text-sm font-body flex-1">{t.message}</p>
                <button
                  onClick={() => dismiss(t.id)}
                  className="text-on-surface-variant hover:text-primary text-lg leading-none"
                  aria-label="Dismiss"
                >
                  ×
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx.toast;
}
