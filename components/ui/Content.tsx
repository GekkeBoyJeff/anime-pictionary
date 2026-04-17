import * as React from "react";
import { cn } from "@/lib/utils/cn";

type ContentSize = "sm" | "md" | "lg";

interface ContentProps {
  value: string | React.ReactNode;
  size?: ContentSize;
  muted?: boolean;
  className?: string;
  id?: string;
}

const sizeClasses: Record<ContentSize, string> = {
  sm: "text-sm leading-6",
  md: "text-base leading-7",
  lg: "text-lg leading-8",
};

export function Content({
  value,
  size = "md",
  muted = false,
  className,
  id,
}: ContentProps) {
  return (
    <p
      id={id}
      className={cn(
        "max-w-prose",
        sizeClasses[size],
        muted ? "text-muted" : "text-paper/90",
        className
      )}
    >
      {value}
    </p>
  );
}
