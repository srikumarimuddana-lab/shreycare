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
    "bg-primary text-on-primary px-10 py-4 rounded-md font-bold tracking-tight hover:opacity-90 transition-all active:scale-95",
  secondary:
    "bg-secondary-container text-on-secondary-container px-10 py-4 rounded-md font-bold tracking-tight hover:opacity-90 transition-all active:scale-95",
  tertiary:
    "text-primary font-bold border-b border-primary/30 pb-1 hover:border-primary transition-all bg-transparent",
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
