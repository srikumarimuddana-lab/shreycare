import { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function Input({ label, className = "", id, ...props }: InputProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label
          htmlFor={id}
          className="text-xs uppercase tracking-widest font-bold text-primary"
        >
          {label}
        </label>
      )}
      <input
        id={id}
        className={`w-full bg-surface-container-low border-none rounded-sm px-6 py-4 text-on-surface font-body focus:bg-surface-container-highest focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors caret-primary ${className}`}
        {...props}
      />
    </div>
  );
}

export function Textarea({
  label,
  className = "",
  id,
  ...props
}: TextareaProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label
          htmlFor={id}
          className="text-xs uppercase tracking-widest font-bold text-primary"
        >
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={`w-full bg-surface-container-low border-none rounded-sm px-6 py-4 text-on-surface font-body focus:bg-surface-container-highest focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors caret-primary resize-none ${className}`}
        {...props}
      />
    </div>
  );
}
