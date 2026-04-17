/*
 * AnimeSearch — top-of-home search experience.
 *
 * Layout:
 *   - Single row: [text input] [Seizoen] [Genre]
 *   - Results appear below when any filter is active (including just filters
 *     without text).
 *
 * The component receives an already-loaded catalog. It does no fetching.
 * Empty state (no filters yet) is also the cue to show the swipe deck — so
 * we leave that to the parent rather than rendering a big empty state here.
 */

import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { cn } from "../../lib/cn.js";
import { displayTitle } from "../../lib/catalog.js";
import {
    DEFAULT_TYPE_BUCKET,
    filterCatalog,
    getAllGenres,
    getAvailableSeasons,
} from "../../lib/filters.js";
import { SeasonPicker } from "./SeasonPicker.jsx";
import { GenrePicker } from "./GenrePicker.jsx";
import { TypePicker } from "./TypePicker.jsx";

// Small debounce hook scoped to this file so the search inputs stay fast
// without shipping a utility library.
const useDebounced = (value, delay = 150) => {
    const [v, setV] = useState(value);
    useEffect(() => {
        const id = window.setTimeout(() => setV(value), delay);
        return () => window.clearTimeout(id);
    }, [value, delay]);
    return v;
};

const ResultCard = ({ entry, onPick }) => (
    <button
        type="button"
        onClick={() => onPick(entry.mal_id)}
        className={cn(
            "group flex items-start gap-3 w-full text-left",
            "rounded-md border border-sumi/15 bg-washi-soft p-2.5",
            "hover:border-spirit/60 hover:shadow-(--shadow-card)",
            "transition-[box-shadow,border-color] duration-150",
            "focus-ring"
        )}
    >
        {entry.picture ? (
            <img
                src={entry.picture}
                alt=""
                width={48}
                height={72}
                loading="lazy"
                decoding="async"
                className="h-18 w-12 flex-none rounded-md bg-washi-deep object-cover"
            />
        ) : (
            <div className="h-18 w-12 flex-none rounded-md bg-washi-deep" />
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate font-serif font-semibold text-sumi group-hover:text-spirit">
                {displayTitle(entry)}
            </span>
            <span className="text-xs text-muted">
                {entry.type}
                {entry.year ? ` · ${entry.year}` : ""}
                {entry.episodes ? ` · ${entry.episodes} eps` : ""}
            </span>
            {entry.tags?.length ? (
                <span className="truncate text-xs text-muted/80">
                    {entry.tags.slice(0, 3).join(" · ")}
                </span>
            ) : null}
        </div>
    </button>
);

export const AnimeSearch = ({ catalog, className }) => {
    const [, setLocation] = useLocation();
    const [text, setText] = useState("");
    const [season, setSeason] = useState(null);
    const [genres, setGenres] = useState([]);
    const [typeBucket, setTypeBucket] = useState(DEFAULT_TYPE_BUCKET);
    const debouncedText = useDebounced(text, 160);

    const seasons = useMemo(() => getAvailableSeasons(catalog, 8), [catalog]);
    const allGenres = useMemo(() => getAllGenres(catalog), [catalog]);

    // "Active" means user typed text, picked a season, or picked a genre.
    // The type bucket alone doesn't count — it's always "set" by default.
    const hasActiveFilter =
        debouncedText.trim().length > 0 || season !== null || genres.length > 0;

    const results = useMemo(() => {
        if (!hasActiveFilter) return [];
        return filterCatalog(catalog, {
            text: debouncedText,
            season,
            genres,
            typeBucket,
            limit: 36,
        });
    }, [catalog, debouncedText, season, genres, typeBucket, hasActiveFilter]);

    const handlePick = (malId) => setLocation(`/anime/${malId}`);

    return (
        <section aria-label="Zoek anime" className={cn("flex flex-col gap-3", className)}>
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <label className="relative flex-1">
                    <span className="sr-only">Zoek anime</span>
                    <span
                        aria-hidden
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sumi/50"
                    >
                        🔍
                    </span>
                    <input
                        type="search"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Zoek anime…"
                        autoComplete="off"
                        maxLength={80}
                        className={cn(
                            "w-full h-12 pl-10 pr-4 rounded-md",
                            "border border-sumi/20 bg-washi-soft",
                            "font-sans text-base text-sumi placeholder:text-muted/70",
                            "focus:border-spirit focus-ring"
                        )}
                    />
                </label>

                <div className="flex flex-wrap items-center gap-2">
                    <TypePicker value={typeBucket} onChange={setTypeBucket} />
                    <SeasonPicker seasons={seasons} value={season} onChange={setSeason} />
                    <GenrePicker genres={allGenres} value={genres} onChange={setGenres} />
                </div>
            </div>

            {hasActiveFilter ? (
                <div className="flex flex-col gap-2">
                    <p className="text-xs text-muted">
                        {results.length === 0
                            ? "Geen resultaten."
                            : `${results.length} resultaat${results.length === 1 ? "" : "en"}`}
                    </p>
                    {results.length > 0 ? (
                        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            {results.map((entry) => (
                                <li key={entry.mal_id}>
                                    <ResultCard entry={entry} onPick={handlePick} />
                                </li>
                            ))}
                        </ul>
                    ) : null}
                </div>
            ) : null}
        </section>
    );
};
