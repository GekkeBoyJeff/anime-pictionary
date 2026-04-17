/*
 * Button — shared primitive. Subtle elevation, modern rounded corners.
 *
 * Variants:
 *   - primary → spirit purple CTA
 *   - lantern → amber secondary CTA
 *   - ghost   → low-emphasis
 *   - danger  → vermillion destructive
 */

import { forwardRef } from "react";
import { cn } from "../../lib/cn.js";

const variantClass = {
    primary:
        "bg-spirit text-washi-soft hover:bg-spirit-bright shadow-(--shadow-card) hover:shadow-(--shadow-card-hover)",
    lantern:
        "bg-lantern text-sumi hover:bg-lantern-deep hover:text-washi-soft shadow-(--shadow-card) hover:shadow-(--shadow-card-hover)",
    ghost:
        "bg-transparent text-sumi border border-sumi/20 hover:border-sumi/50 hover:bg-washi-soft",
    danger:
        "bg-vermillion text-washi-soft hover:bg-vermillion/90 shadow-(--shadow-card) hover:shadow-(--shadow-card-hover)",
};

// Uniform heights (36 / 44 / 56 / 64). No more "whatever feels right".
const sizeClass = {
    sm: "h-9 px-4 text-sm rounded-lg",
    md: "h-11 px-5 text-base rounded-md",
    lg: "h-14 px-6 text-lg rounded-md",
    xl: "h-16 px-8 text-xl rounded-lg",
};

export const Button = forwardRef(
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
                    "inline-flex items-center justify-center gap-2 font-sans font-semibold tracking-tight",
                    "transition-[transform,background,box-shadow,color] duration-150 ease-out",
                    "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none",
                    "focus-ring",
                    "active:translate-y-px",
                    variantClass[variant],
                    sizeClass[size],
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
