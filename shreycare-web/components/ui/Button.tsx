import { type ButtonHTMLAttributes, type AnchorHTMLAttributes } from "react";
import Link from "next/link";

type ButtonVariant = "primary" | "secondary" | "tertiary";

type ButtonAsButton = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  href?: undefined;
};

type ButtonAsLink = AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: ButtonVariant;
  href: string;
};

type ButtonProps = ButtonAsButton | ButtonAsLink;

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-on-primary px-8 md:px-10 py-3.5 md:py-4 rounded-md font-semibold tracking-tight text-center hover:bg-primary-container hover:-translate-y-0.5 transition-all active:scale-95",
  secondary:
    "bg-secondary-container text-on-secondary-container px-8 md:px-10 py-3.5 md:py-4 rounded-md font-semibold tracking-tight text-center hover:opacity-90 hover:-translate-y-0.5 transition-all active:scale-95",
  tertiary:
    "text-primary font-semibold border-b border-primary/30 pb-1 hover:border-primary transition-all bg-transparent text-center",
};

export function Button(props: ButtonProps) {
  const { variant = "primary", className = "", children, ...rest } = props;
  const styles = `${variantStyles[variant]} ${className}`;

  if (rest.href != null) {
    const { href, ...linkRest } = rest as ButtonAsLink;
    return (
      <Link href={href} className={styles} {...linkRest}>
        {children}
      </Link>
    );
  }

  const { ...buttonRest } = rest as ButtonAsButton;
  return (
    <button className={styles} {...buttonRest}>
      {children}
    </button>
  );
}
