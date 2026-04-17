/*
 * SwipeCard — single anime card in the swipe deck.
 *
 * Visually: full-bleed cover on top, title block overlay at the bottom.
 * Has nothing to do with swipe logic itself — that lives in AnimeSwipeDeck
 * so the card stays a "dumb" presentational component.
 */

import { cn } from "../../lib/cn.js";

export const SwipeCard = ({ entry, className, style, onPick, active = true, ...rest }) => (
    <article
        className={cn(
            "absolute inset-0 overflow-hidden rounded-lg border border-sumi/15",
            "bg-washi-soft shadow-(--shadow-pop)",
            "transition-transform duration-100 ease-out",
            active ? "cursor-grab active:cursor-grabbing" : "pointer-events-none",
            className
        )}
        style={style}
        {...rest}
    >
        {entry?.picture ? (
            <img
                src={entry.picture}
                alt=""
                draggable={false}
                className="absolute inset-0 h-full w-full object-cover select-none"
            />
        ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-spirit/40 to-lantern/30" />
        )}

        {/* Readable gradient so text stays legible regardless of cover art */}
        <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-sumi/90 via-sumi/50 to-transparent"
        />

        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-5 text-washi-soft">
            <div className="flex flex-col gap-1">
                <h3 className="font-display text-3xl md:text-4xl leading-tight tracking-tight">
                    {entry?.title ?? "…"}
                </h3>
                <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-washi-soft/80">
                    {entry?.year ? <span>{entry.year}</span> : null}
                    {entry?.type ? <span>· {entry.type}</span> : null}
                    {entry?.episodes ? <span>· {entry.episodes} eps</span> : null}
                </p>
                {entry?.tags?.length ? (
                    <ul className="mt-1.5 flex flex-wrap gap-1">
                        {entry.tags.slice(0, 3).map((tag) => (
                            <li
                                key={tag}
                                className="rounded-full border border-washi-soft/30 bg-sumi/40 px-2 py-0.5 text-[11px] tracking-wide backdrop-blur-sm"
                            >
                                {tag}
                            </li>
                        ))}
                    </ul>
                ) : null}
            </div>

            {active && onPick ? (
                <button
                    type="button"
                    onClick={() => onPick(entry.mal_id)}
                    className={cn(
                        "h-12 w-full rounded-md bg-vermillion text-washi-soft font-semibold tracking-tight",
                        "shadow-[0_8px_20px_-8px_oklch(58%_0.22_28/.6)]",
                        "hover:bg-vermillion/90 active:translate-y-px transition",
                        "focus-ring"
                    )}
                >
                    Teken dit!
                </button>
            ) : null}
        </div>
    </article>
);
