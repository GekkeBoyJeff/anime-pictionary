/*
 * Content — every paragraph renders through this primitive so text styles
 * stay consistent (line-height, max-width, muted state).
 *
 * Accepts `value` as either a plain string (goes into <p>) or a React node
 * when you need inline spans/emphasis.
 */

import { cn } from "../../lib/cn.js";

const sizeClass = {
    sm: "text-sm leading-6",
    md: "text-base leading-7",
    lg: "text-lg md:text-xl leading-8",
};

export const Content = ({ value, size = "md", muted = false, className, id }) => (
    <p
        id={id}
        className={cn(
            "max-w-prose font-sans",
            sizeClass[size],
            muted ? "text-muted" : "text-sumi",
            className
        )}
    >
        {value}
    </p>
);
