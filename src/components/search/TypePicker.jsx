/*
 * TypePicker — three-way segmented control for the catalog type bucket.
 *
 * Options (defined in lib/filters.js as TYPE_BUCKETS):
 *   - Series (default) → TV + ONA
 *   - Films            → MOVIE
 *   - Alles            → everything including OVA + SPECIAL
 *
 * Rendered inline as three pill buttons (not a disclosure like Season/Genre
 * because there's only 3 options — a dropdown would be overkill).
 */

import { cn } from "../../lib/cn.js";
import { TYPE_BUCKETS } from "../../lib/filters.js";

const ORDER = ["series", "film", "all"];

export const TypePicker = ({ value, onChange, className }) => (
    <div
        role="radiogroup"
        aria-label="Type"
        className={cn("inline-flex items-center gap-1 rounded-full border border-sumi/25 bg-washi-soft p-0.5", className)}
    >
        {ORDER.map((key) => {
            const bucket = TYPE_BUCKETS[key];
            const active = value === key;
            return (
                <button
                    key={key}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => onChange(key)}
                    className={cn(
                        "h-8 rounded-full px-3 text-xs font-medium transition-colors focus-ring",
                        active
                            ? "bg-spirit text-washi-soft"
                            : "text-sumi/70 hover:text-sumi"
                    )}
                >
                    {bucket.label}
                </button>
            );
        })}
    </div>
);
