/*
 * useSwipeGesture — pointer-events-based swipe detection.
 *
 * What you get back:
 *   - onPointerDown/Move/Up handlers to spread onto the element
 *   - `delta` (x offset during drag), `dragging` (bool), `direction` ("left"|"right"|null)
 *
 * On pointer release it fires `onSwipe(direction)` if the drag crossed
 * the threshold (default 80px), otherwise snaps back to zero via `resetDelta`.
 *
 * Why a custom hook instead of react-tinder-card or framer-motion's drag:
 *   - 0 KB of dependency weight
 *   - Full control over the animation style — matches the paper/washi vibe
 *   - Teachable: the whole hook fits on one screen
 */

import { useRef, useState, useCallback } from "react";

const THRESHOLD_PX = 80;

export const useSwipeGesture = ({ onSwipe }) => {
    const [delta, setDelta] = useState(0);
    const [dragging, setDragging] = useState(false);
    const startXRef = useRef(0);
    const pointerIdRef = useRef(null);

    const onPointerDown = useCallback((event) => {
        // Only primary button / single-finger touch
        if (event.button !== 0 && event.pointerType !== "touch") return;
        event.currentTarget.setPointerCapture(event.pointerId);
        pointerIdRef.current = event.pointerId;
        startXRef.current = event.clientX;
        setDragging(true);
    }, []);

    const onPointerMove = useCallback((event) => {
        if (pointerIdRef.current !== event.pointerId) return;
        setDelta(event.clientX - startXRef.current);
    }, []);

    const endDrag = useCallback(
        (event) => {
            if (pointerIdRef.current !== event.pointerId) return;
            pointerIdRef.current = null;
            setDragging(false);

            const finalDelta = event.clientX - startXRef.current;
            if (Math.abs(finalDelta) >= THRESHOLD_PX) {
                onSwipe(finalDelta > 0 ? "right" : "left");
            }
            setDelta(0);
        },
        [onSwipe]
    );

    const resetDelta = useCallback(() => setDelta(0), []);

    return {
        delta,
        dragging,
        handlers: {
            onPointerDown,
            onPointerMove,
            onPointerUp: endDrag,
            onPointerCancel: endDrag,
        },
        resetDelta,
    };
};
