/*
 * InspirationGrid — the three drawable prompts, rendered bold enough to be
 * the visual anchor of the Inspiratiescherm.
 *
 * Why this has its own component: the hint-render is the single most
 * important thing on the screen; if it falls back to a <ul> it competes
 * with everything else for attention. Isolating it means we can tune its
 * visual weight without touching the rest of the page.
 */

import { cn } from "../../lib/cn.js";

export const InspirationGrid = ({ hints, className }) => (
    <ol
        className={cn("grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-5", className)}
        aria-label="Tekenbare objecten"
    >
        {hints.map((hint, index) => (
            <li
                key={hint}
                className={cn(
                    "relative overflow-hidden rounded-lg",
                    "border border-sumi/15 bg-washi-soft p-5 md:p-6",
                    "shadow-(--shadow-card)",
                    "flex flex-col gap-2"
                )}
            >
                <span
                    aria-hidden
                    className="font-display text-6xl md:text-7xl leading-none text-spirit/30"
                >
                    {String(index + 1).padStart(2, "0")}
                </span>
                <span className="font-serif text-2xl md:text-3xl font-bold leading-tight text-sumi">
                    {hint}
                </span>
            </li>
        ))}
    </ol>
);
