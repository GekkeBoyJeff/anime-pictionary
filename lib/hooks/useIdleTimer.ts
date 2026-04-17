"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseIdleTimerOptions {
  /** ms of no activity before `isIdle` flips to true */
  idleAfterMs: number;
  /** events that count as user activity */
  events?: (keyof WindowEventMap)[];
  /** disable the timer entirely */
  disabled?: boolean;
}

const DEFAULT_EVENTS: (keyof WindowEventMap)[] = [
  "mousemove",
  "mousedown",
  "keydown",
  "touchstart",
  "wheel",
  "scroll",
];

export function useIdleTimer({
  idleAfterMs,
  events = DEFAULT_EVENTS,
  disabled = false,
}: UseIdleTimerOptions): { isIdle: boolean; reset: () => void } {
  const [isIdle, setIsIdle] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const idleAfterMsRef = useRef(idleAfterMs);

  useEffect(() => {
    idleAfterMsRef.current = idleAfterMs;
  }, [idleAfterMs]);

  const scheduleIdle = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => {
      setIsIdle(true);
    }, idleAfterMsRef.current);
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
}
