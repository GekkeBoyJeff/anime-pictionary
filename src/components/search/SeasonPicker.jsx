/*
 * SeasonPicker — compact dropdown for MAL season tuples.
 *
 * Kept deliberately simple: a <details>/<summary> disclosure with a radio
 * list inside. No popover library, no floating-ui, no portals. Works in
 * every browser, keyboard-accessible out of the box.
 */

import { useRef } from "react";
import { cn } from "../../lib/cn.js";
import { formatSeason } from "../../lib/filters.js";

export const SeasonPicker = ({ seasons, value, onChange, className }) => {
    const ref = useRef(null);

    const handleSelect = (season) => {
        onChange(season);
        // Close the disclosure after a selection so the sheet doesn't linger.
        if (ref.current) ref.current.open = false;
    };

    const active = value
        ? formatSeason(value)
        : "Seizoen";

    return (
        <details
            ref={ref}
            className={cn(
                "relative inline-block",
                className
            )}
        >
            <summary
                className={cn(
                    "cursor-pointer select-none list-none",
                    "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full",
                    "text-sm font-medium border",
                    value
                        ? "border-spirit bg-spirit text-washi-soft"
                        : "border-sumi/25 bg-washi-soft text-sumi hover:border-sumi/50",
                    "focus-ring"
                )}
            >
                <span>{active}</span>
                <span aria-hidden className="text-xs opacity-70">▾</span>
            </summary>

            <div
                role="listbox"
                className="absolute left-0 top-full mt-2 z-20 w-56 max-h-72 overflow-auto rounded-md border border-sumi/15 bg-washi-soft p-1 shadow-(--shadow-pop)"
            >
                <button
                    type="button"
                    onClick={() => handleSelect(null)}
                    className={cn(
                        "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm",
                        !value ? "bg-spirit/10 text-spirit font-semibold" : "hover:bg-washi-deep"
                    )}
                >
                    Alle seizoenen
                </button>
                {seasons.map((s) => {
                    const key = `${s.year}-${s.season}`;
                    const selected = value && value.year === s.year && value.season === s.season;
                    return (
                        <button
                            key={key}
                            type="button"
                            onClick={() => handleSelect(s)}
                            className={cn(
                                "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm",
                                selected
                                    ? "bg-spirit/10 text-spirit font-semibold"
                                    : "hover:bg-washi-deep"
                            )}
                        >
                            {formatSeason(s)}
                        </button>
                    );
                })}
            </div>
        </details>
    );
};
