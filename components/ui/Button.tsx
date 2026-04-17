import * as React from "react";
import { cn } from "@/lib/utils/cn";

type ButtonVariant = "primary" | "ghost" | "pulse-cta" | "danger";
type ButtonSize = "sm" | "md" | "lg" | "xl";

interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "disabled"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-paper hover:bg-accent/90 active:bg-accent-soft shadow-[0_10px_30px_-10px_oklch(70%_0.25_340/.6)]",
  ghost:
    "bg-transparent text-paper border border-ink-border hover:bg-ink-soft hover:border-muted",
  "pulse-cta":
    "bg-signal text-ink font-black animate-pulse shadow-[0_0_0_0_oklch(82%_0.18_90/.6)] hover:animate-none hover:bg-signal/90",
  danger:
    "bg-alarm text-paper hover:bg-alarm/90 shadow-[0_10px_30px_-10px_oklch(62%_0.24_28/.6)]",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-base",
  lg: "h-14 px-8 text-lg",
  xl: "h-20 px-12 text-2xl md:text-3xl",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      disabled = false,
      fullWidth = false,
      className,
      children,
      type = "button",
      ...rest
    },
    ref
  ) => {
    const isDisabled = disabled || loading;
    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl font-semibold tracking-tight transition-[background,transform,box-shadow] duration-200 ease-out focus-ring",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "active:scale-[0.98]",
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && "w-full",
          className
        )}
        {...rest}
      >
        {loading ? (
          <span
            className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden
          />
        ) : null}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
