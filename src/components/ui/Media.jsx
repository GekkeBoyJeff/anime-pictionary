/*
 * Media — figure/image primitive with srcset per breakpoint.
 *
 * Why a custom component instead of just <img>:
 *   - Explicit width/height avoids CLS on stage (a resize would be visible).
 *   - One place to tune lazy vs eager strategy.
 *   - Optional caption stays out of layout-critical markup.
 */

import { cn } from "../../lib/cn.js";

/**
 * Build an HTML srcset string from a map of breakpoint → url.
 * Returns undefined when no breakpoints are provided so we don't render
 * an empty attribute.
 */
const buildSrcSet = (breakpoints) => {
    if (!breakpoints) return undefined;
    const entries = Object.entries(breakpoints);
    if (entries.length === 0) return undefined;
    return entries.map(([w, url]) => `${url} ${w}w`).join(", ");
};

/** Mirror buildSrcSet: turn breakpoints into a `sizes` hint. */
const buildSizes = (breakpoints) => {
    if (!breakpoints) return undefined;
    const widths = Object.keys(breakpoints)
        .map((w) => Number.parseInt(w, 10))
        .sort((a, b) => a - b);
    if (widths.length === 0) return undefined;
    const parts = widths.slice(0, -1).map((bp) => `(max-width: ${bp}px) ${bp}px`);
    parts.push(`${widths[widths.length - 1]}px`);
    return parts.join(", ");
};

export const Media = ({
    src,
    alt,
    breakpoints,
    caption,
    priority = false,
    className,
    figureClassName,
    width,
    height,
}) => (
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
