"use client";

import { useEffect } from "react";

type ToastVariant = "info" | "success" | "error";

interface BotanicalToastProps {
  message: string;
  variant?: ToastVariant;
  visible: boolean;
  onClose: () => void;
}

const variantAccent: Record<ToastVariant, string> = {
  info: "bg-primary",
  success: "bg-primary",
  error: "bg-error",
};

export function BotanicalToast({
  message,
  variant = "info",
  visible,
  onClose,
}: BotanicalToastProps) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="flex items-stretch bg-surface-container-lowest/90 backdrop-blur-xl rounded-lg shadow-botanical-lg overflow-hidden">
        <div className={`w-1 ${variantAccent[variant]}`} />
        <div className="px-6 py-4 flex items-center gap-4">
          <p className="text-on-surface text-sm font-body">{message}</p>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-primary text-sm"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
