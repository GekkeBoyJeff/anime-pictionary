/*
 * Link — wraps Wouter's Link with three visual variants that match our
 * Button system. Keeping them structurally identical means a button-like
 * link lines up pixel-perfect with real buttons.
 */

import { Link as WouterLink } from "wouter";
import { cn } from "../../lib/cn.js";

const variantClass = {
    inline:
        "text-spirit underline-offset-4 decoration-2 hover:underline focus-ring",
    nav: "text-sumi/70 hover:text-sumi transition-colors focus-ring font-medium",
    button:
        "inline-flex items-center justify-center h-14 px-6 text-lg rounded-md bg-spirit text-washi-soft font-semibold tracking-tight shadow-(--shadow-card) hover:bg-spirit-bright hover:shadow-(--shadow-card-hover) active:translate-y-px transition-all duration-150 focus-ring",
};

export const Link = ({ variant = "inline", className, children, ...rest }) => (
    <WouterLink className={cn(variantClass[variant], className)} {...rest}>
        {children}
    </WouterLink>
);
