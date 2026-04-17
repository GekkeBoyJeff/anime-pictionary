"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseCountdownOptions {
  autoStart?: boolean;
  onComplete?: () => void;
}

interface UseCountdownResult {
  remaining: number;
  isRunning: boolean;
  start: () => void;
  pause: () => void;
  reset: (nextSeconds?: number) => void;
}

export function useCountdown(
  initialSeconds: number,
  { autoStart = true, onComplete }: UseCountdownOptions = {}
): UseCountdownResult {
  const [remaining, setRemaining] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(autoStart);

  const onCompleteRef = useRef(onComplete);
  const initialSecondsRef = useRef(initialSeconds);
  const autoStartRef = useRef(autoStart);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    initialSecondsRef.current = initialSeconds;
  }, [initialSeconds]);

  useEffect(() => {
    autoStartRef.current = autoStart;
  }, [autoStart]);

  useEffect(() => {
    if (!isRunning) return;
    if (remaining <= 0) {
      setIsRunning(false);
      onCompleteRef.current?.();
      return;
    }

    const id = window.setTimeout(() => {
      setRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => window.clearTimeout(id);
  }, [isRunning, remaining]);

  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);
  const reset = useCallback((nextSeconds?: number) => {
    setRemaining(nextSeconds ?? initialSecondsRef.current);
    setIsRunning(autoStartRef.current);
  }, []);

  return { remaining, isRunning, start, pause, reset };
}
