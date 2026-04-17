/*
 * AnimeSwipeDeck — stack of two cards with a proper exit animation.
 *
 * Choreography on swipe:
 *   1. Gesture threshold crossed (pointer release or ✕/➜ button) — we record
 *      an "exiting" direction on the top card.
 *   2. The top card animates fully off-screen in that direction while the
 *      peek card simultaneously grows from scale 0.96 → 1 and fades from
 *      85% → 100% opacity, stepping into the "front" slot.
 *   3. After the animation duration, we swap the queue (peek becomes the new
 *      top, a fresh random MAL id takes the peek slot) and clear the exit
 *      state. Because the peek was already rendered at the final
 *      position/opacity during step 2, the swap is visually seamless.
 *
 * Duplicates across the deck are allowed (many players = random walk), but
 * we never let the same MAL id appear twice in a row — `pickFromCatalog`
 * receives the outgoing id as an exclusion.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useSwipeGesture } from "../../hooks/useSwipeGesture.js";
import { pickFromCatalog } from "../../lib/random.js";
import { cn } from "../../lib/cn.js";
import { SwipeCard } from "./SwipeCard.jsx";

// Kept in one place so the feel can be retuned from a single constant.
const EXIT_MS = 320;
const EXIT_DISTANCE = "120vw";

const ActionButton = ({ label, symbol, tone, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className={cn(
            "inline-flex size-14 md:size-16 items-center justify-center rounded-full",
            "text-2xl font-semibold shadow-(--shadow-card)",
            "transition-[transform,box-shadow] duration-150 hover:shadow-(--shadow-card-hover) active:translate-y-px",
            "focus-ring",
            tone === "reject"
                ? "border border-sumi/30 bg-washi-soft text-sumi hover:bg-washi-deep"
                : "border border-sumi/30 bg-washi-soft text-spirit hover:bg-washi-deep"
        )}
        aria-label={label}
    >
        <span aria-hidden>{symbol}</span>
    </button>
);

export const AnimeSwipeDeck = ({ catalog }) => {
    const [, setLocation] = useLocation();

    // Pick two distinct starting MAL ids. useMemo (not useState initialiser)
    // so swapping the catalog reshuffles the deck.
    const initial = useMemo(() => {
        const a = pickFromCatalog(catalog);
        const b = pickFromCatalog(catalog, a);
        return [a, b];
    }, [catalog]);

    const [queue, setQueue] = useState(initial);
    const [exiting, setExiting] = useState(null); // "left" | "right" | null
    const exitTimerRef = useRef(null);

    // Top-up the queue if a slot becomes null (rare filter edge case).
    useEffect(() => {
        if (queue[0] == null || queue[1] == null) {
            setQueue([pickFromCatalog(catalog), pickFromCatalog(catalog, queue[0])]);
        }
    }, [queue, catalog]);

    // Always clean up the pending exit timer on unmount.
    useEffect(
        () => () => {
            if (exitTimerRef.current !== null) {
                window.clearTimeout(exitTimerRef.current);
            }
        },
        []
    );

    const triggerExit = (direction) => {
        if (exiting) return; // Already animating — ignore double-taps.
        setExiting(direction);

        exitTimerRef.current = window.setTimeout(() => {
            setQueue(([, next]) => [next, pickFromCatalog(catalog, next)]);
            setExiting(null);
            exitTimerRef.current = null;
        }, EXIT_MS);
    };

    const { delta, dragging, handlers } = useSwipeGesture({
        onSwipe: (direction) => triggerExit(direction),
    });

    const handlePick = (malId) => {
        setLocation(`/anime/${malId}`);
    };

    const topEntry = useMemo(
        () => catalog.data.find((e) => e.mal_id === queue[0]) ?? null,
        [catalog, queue]
    );
    const peekEntry = useMemo(
        () => catalog.data.find((e) => e.mal_id === queue[1]) ?? null,
        [catalog, queue]
    );

    // Top card style.
    //   Exit: translate fully off-screen + big rotation + fade out.
    //   Drag: follow finger with small tilt (delta/24 ≈ 3.3° per 80px).
    //   Rest: sit centred with a snap-back transition on release.
    const topStyle = exiting
        ? {
              transform: `translateX(${exiting === "right" ? EXIT_DISTANCE : `-${EXIT_DISTANCE}`}) rotate(${exiting === "right" ? 18 : -18}deg)`,
              transition: `transform ${EXIT_MS}ms cubic-bezier(.5,.05,.3,1), opacity ${EXIT_MS}ms ease-out`,
              opacity: 0,
              pointerEvents: "none",
          }
        : {
              transform: `translateX(${delta}px) rotate(${delta / 24}deg)`,
              transition: dragging
                  ? "none"
                  : "transform 180ms cubic-bezier(.2,.7,.2,1)",
          };

    // Peek card style. Rest: slightly shrunk + faded. Exit: step to front.
    // Animating in parallel with the top's exit means the new front card
    // arrives rather than popping in.
    const peekStyle = exiting
        ? {
              transform: "scale(1) translateY(0)",
              opacity: 1,
              transition: `transform ${EXIT_MS}ms cubic-bezier(.3,.1,.2,1), opacity ${EXIT_MS}ms ease-out`,
          }
        : {
              transform: "scale(0.96) translateY(4px)",
              opacity: 0.85,
              transition: "transform 220ms ease-out, opacity 220ms ease-out",
          };

    return (
        <div className="flex flex-col items-center gap-4">
            <div
                className="relative w-full max-w-sm aspect-3/4"
                {...handlers}
                style={{ touchAction: "pan-y" }}
            >
                {/*
                    KEY PROP FIX — keying each SwipeCard on its MAL id makes
                    React unmount the outgoing card at queue-swap time and mount
                    a fresh one at its rest transform. Without this, the top
                    slot would keep the same mounted node and visibly animate
                    "back" from the exit position carrying the new entry's DOM.
                */}
                {peekEntry ? (
                    <SwipeCard
                        key={`peek-${peekEntry.mal_id}`}
                        entry={peekEntry}
                        active={false}
                        style={peekStyle}
                        className="scale-in"
                    />
                ) : null}

                {topEntry ? (
                    <SwipeCard
                        key={`top-${topEntry.mal_id}`}
                        entry={topEntry}
                        active={!exiting}
                        onPick={handlePick}
                        style={topStyle}
                    />
                ) : null}
            </div>

            <div className="flex items-center gap-5">
                <ActionButton
                    label="Volgende anime"
                    symbol="✕"
                    tone="reject"
                    onClick={() => triggerExit("left")}
                />
                <p className="text-xs text-muted">
                    Swipe of tik <strong className="font-semibold text-sumi">Teken dit!</strong>
                </p>
                <ActionButton
                    label="Volgende anime"
                    symbol="➜"
                    tone="next"
                    onClick={() => triggerExit("right")}
                />
            </div>
        </div>
    );
};
