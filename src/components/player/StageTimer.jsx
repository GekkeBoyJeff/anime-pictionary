/*
 * StageTimer — refresh-proof 60-second round display with big legible hints.
 *
 * Visual hierarchy (top to bottom on mobile):
 *   - DAC logo + countdown (prominent but not fullscreen).
 *   - Three hint cards, each with 3 reference thumbnails.
 *     Tapping a thumb opens a peek-mode ImageViewer that keeps the timer
 *     partially visible behind a light backdrop and auto-closes after 6s.
 *
 * Stress state (remaining ≤ 10s): hint card borders turn vermillion and the
 * countdown digit turns vermillion too — no fullscreen pulse.
 *
 * Done state (remaining === 0): swaps to a "Tijd is om!" page + next-round CTA.
 */

import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "../ui/Button.jsx";
import { ImageViewer } from "../ui/ImageViewer.jsx";
import { DacLogo } from "../brand/DacLogo.jsx";
import { HintReferenceImages } from "./HintReferenceImages.jsx";
import { clearRound, getRemainingSeconds } from "../../lib/countdown.js";
import { cn } from "../../lib/cn.js";

const TOTAL_SECONDS = 60;
const STRESS_AT = 10;

export const StageTimer = ({ malId, hints, animeTitle }) => {
    const [, setLocation] = useLocation();
    const [remaining, setRemaining] = useState(() =>
        getRemainingSeconds(malId, TOTAL_SECONDS)
    );
    const [viewer, setViewer] = useState({ open: false, urls: [], startIndex: 0 });

    useEffect(() => {
        const id = window.setInterval(() => {
            setRemaining(getRemainingSeconds(malId, TOTAL_SECONDS));
        }, 250);
        return () => window.clearInterval(id);
    }, [malId]);

    const inStress = remaining <= STRESS_AT && remaining > 0;
    const done = remaining === 0;

    const handleNext = () => {
        clearRound(malId);
        setLocation("/");
    };

    // Peek-mode viewer: we only show the tapped image (no gallery navigation)
    // but still pass the full set so if we ever change our minds we can open
    // a gallery later. Today we slice to length 1 to keep the peek experience.
    const handleThumbClick = (_hintIndex, imageIndex, urls) => {
        setViewer({
            open: true,
            urls: [urls[imageIndex]].filter(Boolean),
            startIndex: 0,
        });
    };

    const roundedRemaining = Math.max(0, Math.ceil(remaining));

    /*
     * count-tick animation: keying the countdown span on its current integer
     * makes React unmount + remount per second, which re-fires the animation.
     * Cheaper and more precise than a CSS infinite pulse.
     */
    const tickKey = useMemo(() => roundedRemaining, [roundedRemaining]);

    if (done) {
        return (
            <main className="page-fade-in relative mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-6 px-5 py-12 text-center">
                <span className="font-serif text-sm uppercase tracking-[0.28em] text-vermillion">
                    Tijd is om
                </span>
                <div className="flex flex-col gap-1">
                    <span className="font-serif text-xs uppercase tracking-widest text-muted">
                        De anime was
                    </span>
                    <h1 className="font-display text-hero leading-[0.95] tracking-tight text-sumi">
                        {animeTitle}
                    </h1>
                </div>
                <ol className="flex flex-wrap justify-center gap-2 text-sm text-muted">
                    {hints.map((hint, i) => (
                        <li
                            key={hint}
                            className="rounded-full border border-sumi/20 bg-washi-soft px-3 py-1"
                        >
                            {i + 1}. {hint}
                        </li>
                    ))}
                </ol>
                <Button variant="primary" size="xl" onClick={handleNext}>
                    Volgende ronde →
                </Button>
            </main>
        );
    }

    return (
        <main className="page-fade-in relative mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 px-5 py-5 md:gap-7 md:py-8">
            <nav className="flex items-center justify-between text-sumi/70">
                <DacLogo size={24} aria-label="Dutch Anime Community" />
                <button
                    type="button"
                    onClick={handleNext}
                    className="font-serif text-xs uppercase tracking-widest hover:text-sumi focus-ring rounded px-1"
                >
                    Stop ronde
                </button>
            </nav>

            <header className="flex flex-col items-center gap-0.5">
                <span className="font-serif text-xs uppercase tracking-[0.22em] text-muted">
                    {animeTitle}
                </span>
                <span
                    key={tickKey}
                    className={cn(
                        "count-tick font-display tabular-nums leading-none",
                        "text-[18vw] md:text-[10vw]",
                        inStress ? "text-vermillion" : "text-sumi"
                    )}
                    aria-label={`${roundedRemaining} seconden resterend`}
                >
                    {roundedRemaining}
                </span>
            </header>

            <ol className="flex flex-col gap-3 md:gap-4" aria-label="Tekenbare objecten">
                {hints.map((hint, index) => (
                    <li
                        key={hint}
                        className={cn(
                            "stagger-in flex flex-col gap-3 rounded-lg border bg-washi-soft p-4 md:p-5",
                            "shadow-(--shadow-card)",
                            inStress ? "border-vermillion/70" : "border-sumi/15"
                        )}
                        style={{ "--stagger-index": index }}
                    >
                        <div className="flex items-baseline gap-3">
                            <span className="font-display text-2xl md:text-3xl text-spirit">
                                {String(index + 1).padStart(2, "0")}
                            </span>
                            <h3 className="font-serif text-xl md:text-2xl font-bold leading-tight text-sumi">
                                {hint}
                            </h3>
                        </div>
                        <HintReferenceImages
                            animeTitle={animeTitle}
                            hint={hint}
                            hintIndex={index}
                            onThumbClick={handleThumbClick}
                        />
                    </li>
                ))}
            </ol>

            <ImageViewer
                variant="peek"
                open={viewer.open}
                onClose={() => setViewer({ open: false, urls: [], startIndex: 0 })}
                startIndex={viewer.startIndex}
                images={viewer.urls}
            />
        </main>
    );
};
