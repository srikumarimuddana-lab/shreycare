import { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "tertiary";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  href?: string;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-on-primary px-10 py-4 rounded-md font-bold tracking-tight hover:opacity-90 transition-all active:scale-95",
  secondary:
    "bg-secondary-container text-on-secondary-container px-10 py-4 rounded-md font-bold tracking-tight hover:opacity-90 transition-all active:scale-95",
  tertiary:
    "text-primary font-bold border-b border-primary/30 pb-1 hover:border-primary transition-all bg-transparent",
};

export function Button({
  variant = "primary",
  className = "",
  children,
  href,
  ...props
}: ButtonProps) {
  const styles = `${variantStyles[variant]} ${className}`;

  if (href) {
    return (
      <a href={href} className={styles} {...(props as any)}>
        {children}
      </a>
    );
  }

  return (
    <button className={styles} {...props}>
      {children}
    </button>
  );
}
