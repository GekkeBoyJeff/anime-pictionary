import * as React from "react";
import { cn } from "@/lib/utils/cn";

interface MediaBreakpoints {
  /** Sources keyed by min-width breakpoint label; value is the image URL for that size. */
  [breakpoint: string]: string;
}

interface MediaProps {
  src: string;
  alt: string;
  /** Optional srcset per breakpoint — e.g. { "320": "/sm.jpg", "768": "/md.jpg", "1280": "/lg.jpg" } */
  breakpoints?: MediaBreakpoints;
  caption?: string;
  priority?: boolean;
  className?: string;
  figureClassName?: string;
  /** Intrinsic dimensions — required to avoid CLS. */
  width: number;
  height: number;
}

function buildSrcSet(breakpoints?: MediaBreakpoints): string | undefined {
  if (!breakpoints) return undefined;
  return Object.entries(breakpoints)
    .map(([width, url]) => `${url} ${width}w`)
    .join(", ");
}

function buildSizes(breakpoints?: MediaBreakpoints): string | undefined {
  if (!breakpoints) return undefined;
  const keys = Object.keys(breakpoints)
    .map((k) => parseInt(k, 10))
    .sort((a, b) => a - b);
  const parts = keys
    .slice(0, -1)
    .map((bp) => `(max-width: ${bp}px) ${bp}px`);
  parts.push("100vw");
  return parts.join(", ");
}

export function Media({
  src,
  alt,
  breakpoints,
  caption,
  priority = false,
  className,
  figureClassName,
  width,
  height,
}: MediaProps) {
  return (
    <figure className={cn("relative", figureClassName)}>
      <img
        src={src}
        alt={alt}
        srcSet={buildSrcSet(breakpoints)}
        sizes={buildSizes(breakpoints)}
        width={width}
        height={height}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : undefined}
        decoding="async"
        className={cn("w-full h-auto block", className)}
      />
      {caption ? (
        <figcaption className="mt-2 text-sm text-muted">{caption}</figcaption>
      ) : null}
    </figure>
  );
}
