"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useIdleTimer } from "@/lib/hooks/useIdleTimer";
import { cn } from "@/lib/utils/cn";

interface SmartDefaultBarProps {
  /** ms of inactivity before showing the countdown */
  idleAfterMs?: number;
  /** seconds the countdown runs before auto-navigating */
  countdownSeconds?: number;
  /** URL to navigate to when countdown expires */
  fallbackHref: string;
}

const DEFAULT_IDLE_MS = 5000;
const DEFAULT_COUNTDOWN_S = 5;

export function SmartDefaultBar({
  idleAfterMs = DEFAULT_IDLE_MS,
  countdownSeconds = DEFAULT_COUNTDOWN_S,
  fallbackHref,
}: SmartDefaultBarProps) {
  const router = useRouter();
  const { isIdle, reset } = useIdleTimer({ idleAfterMs });
  const [remaining, setRemaining] = useState(countdownSeconds);

  useEffect(() => {
    if (!isIdle) {
      setRemaining(countdownSeconds);
      return;
    }
    const tick = window.setInterval(() => {
      setRemaining((r) => Math.max(0, r - 1));
    }, 1000);
    return () => window.clearInterval(tick);
  }, [isIdle, countdownSeconds]);

  useEffect(() => {
    if (isIdle && remaining <= 0) {
      router.push(fallbackHref);
    }
  }, [isIdle, remaining, router, fallbackHref]);

  if (!isIdle) return null;

  const progress = 1 - remaining / countdownSeconds;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 flex flex-col gap-3 border-t border-signal/40 bg-ink/95 px-6 py-5 backdrop-blur",
        "animate-[slide-up_300ms_cubic-bezier(0.16,1,0.3,1)_forwards]"
      )}
    >
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-4">
        <div className="flex items-baseline gap-3">
          <span className="text-sm font-semibold uppercase tracking-widest text-signal">
            Keuzestress?
          </span>
          <span className="text-base text-paper/80">
            We kiezen automatisch in{" "}
            <span className="font-black text-paper tabular-nums">
              {remaining}
            </span>
            …
          </span>
        </div>
        <button
          type="button"
          onClick={reset}
          className="rounded-lg border border-paper/30 px-3 py-1.5 text-sm text-paper/80 hover:border-paper hover:text-paper focus-ring"
        >
          Ik kies zelf
        </button>
      </div>
      <div className="mx-auto h-1 w-full max-w-4xl overflow-hidden rounded-full bg-paper/10">
        <div
          className="h-full bg-signal transition-[width] duration-1000 ease-linear"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
