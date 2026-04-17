/*
 * GenrePicker — multi-select genre chip.
 *
 * The catalog exposes hundreds of distinct tags. Dumping them all as a flat
 * wrap was overwhelming, so this component organises the sheet into three
 * parts:
 *
 *   1. Search input (sticky at top) — filters both lists live.
 *   2. Populair section — first 8 tags by frequency. Covers 90% of
 *      real-world pictionary needs with zero scrolling.
 *   3. Alle genres — everything else, sorted by the same frequency order.
 *
 * `genres` is expected to arrive already sorted by frequency (see
 * `getAllGenres` in lib/filters.js).
 */

import { useMemo, useRef, useState } from "react";
import { cn } from "../../lib/cn.js";

const POPULAR_COUNT = 8;

const GenreChip = ({ genre, active, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className={cn(
            "rounded-full px-3 py-1 text-sm border transition-colors",
            active
                ? "border-spirit bg-spirit text-washi-soft"
                : "border-sumi/20 bg-washi hover:border-sumi/50"
        )}
    >
        {genre}
    </button>
);

export const GenrePicker = ({ genres, value, onChange, className }) => {
    const ref = useRef(null);
    const [query, setQuery] = useState("");
    const selected = new Set(value);

    const toggle = (genre) => {
        const next = new Set(selected);
        if (next.has(genre)) next.delete(genre);
        else next.add(genre);
        onChange(Array.from(next));
    };

    const clear = () => onChange([]);

    // Split the list into "popular" (first N) and "rest". Both get filtered
    // by the search query so a niche search doesn't hide matching populars.
    const popular = useMemo(() => genres.slice(0, POPULAR_COUNT), [genres]);
    const rest = useMemo(() => genres.slice(POPULAR_COUNT), [genres]);

    const visiblePopular = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return popular;
        return popular.filter((g) => g.toLowerCase().includes(q));
    }, [popular, query]);

    const visibleRest = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return rest;
        return rest.filter((g) => g.toLowerCase().includes(q));
    }, [rest, query]);

    const hasResults = visiblePopular.length > 0 || visibleRest.length > 0;

    const label =
        selected.size === 0
            ? "Genre"
            : selected.size === 1
              ? Array.from(selected)[0]
              : `${selected.size} genres`;

    return (
        <details ref={ref} className={cn("relative inline-block", className)}>
            <summary
                className={cn(
                    "cursor-pointer select-none list-none",
                    "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full",
                    "text-sm font-medium border",
                    selected.size > 0
                        ? "border-spirit bg-spirit text-washi-soft"
                        : "border-sumi/25 bg-washi-soft text-sumi hover:border-sumi/50",
                    "focus-ring"
                )}
            >
                <span>{label}</span>
                <span aria-hidden className="text-xs opacity-70">▾</span>
            </summary>

            <div
                role="listbox"
                aria-multiselectable
                /*
                 * Mobile: fixed bottom sheet — the filter row often wraps and
                 * the Genre chip can end up at either edge, so anchoring to
                 * the trigger clips half the time. Bottom sheet sidesteps the
                 * whole problem and lands more ergonomically on a phone anyway.
                 *
                 * Desktop (md+): classic anchored dropdown aligned to the
                 * trigger's right edge, since the filter row never wraps there.
                 */
                className={cn(
                    "z-20 max-h-[70vh] overflow-hidden rounded-md border border-sumi/15 bg-washi-soft shadow-(--shadow-pop)",
                    "fixed inset-x-3 bottom-4",
                    "md:absolute md:inset-x-auto md:bottom-auto md:right-0 md:top-full md:mt-2 md:w-80 md:max-w-[calc(100vw-2rem)]"
                )}
            >
                {/* Sticky search + clear row */}
                <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-sumi/10 bg-washi-soft/95 backdrop-blur p-2">
                    <label className="relative flex-1">
                        <span className="sr-only">Zoek genre</span>
                        <span
                            aria-hidden
                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sumi/50 text-xs"
                        >
                            🔍
                        </span>
                        <input
                            type="search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Zoek genre…"
                            autoComplete="off"
                            maxLength={40}
                            className="w-full h-9 pl-8 pr-3 rounded border border-sumi/15 bg-washi text-sm text-sumi placeholder:text-muted/70 focus:border-spirit focus-ring"
                        />
                    </label>
                    {selected.size > 0 ? (
                        <button
                            type="button"
                            onClick={clear}
                            className="rounded px-2 py-1 text-xs font-medium text-muted hover:bg-washi-deep"
                        >
                            Wis
                        </button>
                    ) : null}
                </div>

                {/* Scrollable content */}
                <div className="overflow-auto max-h-[calc(70vh-52px)]">
                    {visiblePopular.length > 0 ? (
                        <section className="p-3 pb-2">
                            <h3 className="mb-2 font-serif text-[10px] uppercase tracking-widest text-muted">
                                Populair
                            </h3>
                            <div className="flex flex-wrap gap-1.5">
                                {visiblePopular.map((g) => (
                                    <GenreChip
                                        key={g}
                                        genre={g}
                                        active={selected.has(g)}
                                        onClick={() => toggle(g)}
                                    />
                                ))}
                            </div>
                        </section>
                    ) : null}

                    {visibleRest.length > 0 ? (
                        <section className="p-3 pt-2">
                            {visiblePopular.length > 0 ? (
                                <h3 className="mb-2 font-serif text-[10px] uppercase tracking-widest text-muted">
                                    Alle genres
                                </h3>
                            ) : null}
                            <div className="flex flex-wrap gap-1.5">
                                {visibleRest.map((g) => (
                                    <GenreChip
                                        key={g}
                                        genre={g}
                                        active={selected.has(g)}
                                        onClick={() => toggle(g)}
                                    />
                                ))}
                            </div>
                        </section>
                    ) : null}

                    {!hasResults ? (
                        <p className="p-4 text-center text-sm text-muted">
                            Geen genres voor &ldquo;{query}&rdquo;.
                        </p>
                    ) : null}
                </div>
            </div>
        </details>
    );
};
