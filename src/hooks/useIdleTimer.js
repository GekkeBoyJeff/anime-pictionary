/*
 * useIdleTimer — fires `isIdle = true` after N milliseconds of zero user
 * activity. Any mouse/key/touch/scroll resets it.
 *
 * Used by the Keuzescherm's "we pick for you" smart-default nudge: if the
 * user just stands there staring, we kick a countdown to auto-pick.
 */

import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_EVENTS = [
    "mousemove",
    "mousedown",
    "keydown",
    "touchstart",
    "wheel",
    "scroll",
];

export const useIdleTimer = ({
    idleAfterMs,
    events = DEFAULT_EVENTS,
    disabled = false,
}) => {
    const [isIdle, setIsIdle] = useState(false);
    const timeoutRef = useRef(null);
    const delayRef = useRef(idleAfterMs);

    // Keep the latest delay in a ref so the scheduler always reads a fresh
    // value without invalidating the event listeners.
    useEffect(() => {
        delayRef.current = idleAfterMs;
    }, [idleAfterMs]);

    const scheduleIdle = useCallback(() => {
        if (timeoutRef.current !== null) {
            window.clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = window.setTimeout(() => {
            setIsIdle(true);
        }, delayRef.current);
    }, []);

    const reset = useCallback(() => {
        setIsIdle(false);
        scheduleIdle();
    }, [scheduleIdle]);

    useEffect(() => {
        if (disabled) {
            setIsIdle(false);
            if (timeoutRef.current !== null) {
                window.clearTimeout(timeoutRef.current);
            }
            return;
        }

        const handleActivity = () => {
            setIsIdle(false);
            scheduleIdle();
        };

        scheduleIdle();
        events.forEach((event) => {
            window.addEventListener(event, handleActivity, { passive: true });
        });

        return () => {
            if (timeoutRef.current !== null) {
                window.clearTimeout(timeoutRef.current);
            }
            events.forEach((event) => {
                window.removeEventListener(event, handleActivity);
            });
        };
    }, [events, disabled, scheduleIdle]);

    return { isIdle, reset };
};
