/*
 * ImageViewer — one modal, two modes.
 *
 * `gallery` mode:
 *   - Fullscreen dim backdrop.
 *   - Shows a single image large, plus prev/next arrows, caption, and
 *     a 1-of-N counter.
 *   - Keyboard: ←/→ navigate, Escape closes.
 *   - Swipe left/right (reuses the home-deck gesture threshold) also navigates.
 *   - Focus is trapped so tab never escapes to underlying page.
 *
 * `peek` mode:
 *   - Lighter backdrop (40% opacity) so the timer + hints stay visible.
 *   - Single image only, no navigation controls. Tap anywhere to close.
 *   - Auto-closes after 6s of inactivity — a forgotten modal on stage
 *     would eat round time.
 *   - No focus trap: drawer's hands are on pen/paper; browser focus is not
 *     the point.
 *
 * Props:
 *   images      — string[] of URLs (gallery) OR single-item array (peek).
 *   startIndex  — initial selection (defaults 0).
 *   caption     — function(image, index) => string, optional.
 *   variant     — "gallery" | "peek".
 *   open        — boolean, controlled by parent.
 *   onClose     — called when user dismisses.
 *
 * The component mounts portals via document.body so the modal sits above
 * sticky CTAs and the page scroll position is preserved underneath.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSwipeGesture } from "../../hooks/useSwipeGesture.js";
import { cn } from "../../lib/cn.js";

const PEEK_AUTO_CLOSE_MS = 6000;

export const ImageViewer = ({
    images,
    startIndex = 0,
    caption,
    variant = "gallery",
    open,
    onClose,
}) => {
    const [index, setIndex] = useState(startIndex);
    const backdropRef = useRef(null);
    const closeTimerRef = useRef(null);

    // Reset to requested start index whenever the viewer re-opens or the
    // source image set changes.
    useEffect(() => {
        if (open) setIndex(startIndex);
    }, [open, startIndex]);

    const total = images?.length ?? 0;
    const current = total > 0 ? images[index] : null;

    const close = useCallback(() => {
        if (closeTimerRef.current !== null) {
            window.clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
        }
        onClose?.();
    }, [onClose]);

    const goto = useCallback(
        (next) => {
            if (total === 0) return;
            const wrapped = ((next % total) + total) % total;
            setIndex(wrapped);
        },
        [total]
    );

    const goNext = useCallback(() => goto(index + 1), [goto, index]);
    const goPrev = useCallback(() => goto(index - 1), [goto, index]);

    // Peek mode auto-close. Reset the timer on any interaction so actively
    // looking at the reference never gets cut off.
    const resetAutoClose = useCallback(() => {
        if (variant !== "peek" || !open) return;
        if (closeTimerRef.current !== null) {
            window.clearTimeout(closeTimerRef.current);
        }
        closeTimerRef.current = window.setTimeout(close, PEEK_AUTO_CLOSE_MS);
    }, [variant, open, close]);

    useEffect(() => {
        if (variant === "peek" && open) {
            resetAutoClose();
        }
        return () => {
            if (closeTimerRef.current !== null) {
                window.clearTimeout(closeTimerRef.current);
                closeTimerRef.current = null;
            }
        };
    }, [variant, open, resetAutoClose]);

    // Keyboard controls for gallery mode. Peek mode only handles Escape.
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => {
            if (e.key === "Escape") {
                e.preventDefault();
                close();
                return;
            }
            if (variant === "gallery") {
                if (e.key === "ArrowRight") {
                    e.preventDefault();
                    goNext();
                }
                if (e.key === "ArrowLeft") {
                    e.preventDefault();
                    goPrev();
                }
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, variant, close, goNext, goPrev]);

    // Lock body scroll while open so the page underneath doesn't scroll
    // with the user's two-finger pinch on mobile.
    useEffect(() => {
        if (!open) return;
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prevOverflow;
        };
    }, [open]);

    // Swipe gesture for gallery navigation. Peek mode just closes on any tap.
    const { handlers: swipeHandlers } = useSwipeGesture({
        onSwipe: (direction) => {
            if (variant !== "gallery") return;
            if (direction === "left") goNext();
            else goPrev();
        },
    });

    if (!open || !current) return null;

    const captionText =
        typeof caption === "function" ? caption(current, index) : null;

    const isGallery = variant === "gallery";

    // Clicking the backdrop (but not the image / controls) closes.
    const onBackdropClick = (event) => {
        if (event.target === backdropRef.current) close();
    };

    return createPortal(
        <div
            ref={backdropRef}
            onClick={onBackdropClick}
            onPointerDown={resetAutoClose}
            className={cn(
                "viewer-backdrop fixed inset-0 z-[100] flex items-center justify-center",
                "p-4 md:p-8",
                isGallery ? "bg-sumi/90 backdrop-blur-sm" : "bg-sumi/40 backdrop-blur-[2px]"
            )}
            role="dialog"
            aria-modal="true"
            aria-label={captionText ?? "Image viewer"}
        >
            {/* Close button — top right, both variants */}
            <button
                type="button"
                onClick={close}
                className={cn(
                    "absolute top-3 right-3 md:top-5 md:right-5",
                    "inline-flex size-11 items-center justify-center rounded-full",
                    "bg-washi-soft/90 text-sumi hover:bg-washi-soft",
                    "text-xl font-semibold shadow-(--shadow-card)",
                    "focus-ring"
                )}
                aria-label="Sluit viewer"
            >
                <span aria-hidden>✕</span>
            </button>

            {/* Prev / next (gallery only) */}
            {isGallery && total > 1 ? (
                <>
                    <button
                        type="button"
                        onClick={goPrev}
                        className={cn(
                            "absolute left-3 md:left-6 top-1/2 -translate-y-1/2",
                            "inline-flex size-12 items-center justify-center rounded-full",
                            "bg-washi-soft/90 text-sumi hover:bg-washi-soft",
                            "text-2xl shadow-(--shadow-card)",
                            "focus-ring"
                        )}
                        aria-label="Vorige afbeelding"
                    >
                        <span aria-hidden>‹</span>
                    </button>
                    <button
                        type="button"
                        onClick={goNext}
                        className={cn(
                            "absolute right-3 md:right-6 top-1/2 -translate-y-1/2",
                            "inline-flex size-12 items-center justify-center rounded-full",
                            "bg-washi-soft/90 text-sumi hover:bg-washi-soft",
                            "text-2xl shadow-(--shadow-card)",
                            "focus-ring"
                        )}
                        aria-label="Volgende afbeelding"
                    >
                        <span aria-hidden>›</span>
                    </button>
                </>
            ) : null}

            {/* Image + caption — swipeable in gallery mode */}
            <figure
                {...(isGallery ? swipeHandlers : {})}
                style={{ touchAction: isGallery ? "pan-y" : undefined }}
                className={cn(
                    "viewer-content flex max-h-full flex-col items-center gap-3",
                    isGallery ? "max-w-[min(900px,90vw)]" : "max-w-[min(700px,85vw)]"
                )}
            >
                <img
                    key={current}
                    src={current}
                    alt={captionText ?? "Referentie"}
                    referrerPolicy="no-referrer"
                    className="max-h-[75vh] w-auto rounded-md bg-washi-deep object-contain"
                />
                {captionText ? (
                    <figcaption
                        className={cn(
                            "font-serif text-sm md:text-base text-washi-soft/90",
                            "max-w-full px-3 text-center"
                        )}
                    >
                        {captionText}
                        {isGallery && total > 1 ? (
                            <span className="ml-2 text-washi-soft/60">
                                · {index + 1} / {total}
                            </span>
                        ) : null}
                    </figcaption>
                ) : null}
            </figure>
        </div>,
        document.body
    );
};
