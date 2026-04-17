import * as React from "react";
import NextLink from "next/link";
import { cn } from "@/lib/utils/cn";

type LinkVariant = "inline" | "nav" | "button";

interface LinkProps
  extends Omit<React.ComponentProps<typeof NextLink>, "className"> {
  variant?: LinkVariant;
  className?: string;
  children: React.ReactNode;
}

const variantClasses: Record<LinkVariant, string> = {
  inline:
    "text-accent underline-offset-4 hover:underline focus-ring rounded-sm",
  nav: "text-paper/80 hover:text-paper transition-colors focus-ring rounded-sm font-medium",
  button:
    "inline-flex items-center justify-center h-11 px-6 rounded-xl bg-accent text-paper font-semibold hover:bg-accent/90 transition-colors focus-ring",
};

export function Link({
  variant = "inline",
  className,
  children,
  ...rest
}: LinkProps) {
  return (
    <NextLink className={cn(variantClasses[variant], className)} {...rest}>
      {children}
    </NextLink>
  );
}
