"use client";

import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { useCountdown } from "@/lib/hooks/useCountdown";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";

interface TimerCountdownProps {
  hints: readonly [string, string, string];
  seconds?: number;
  /** red stress state kicks in when remaining <= this value */
  stressAt?: number;
}

const DEFAULT_SECONDS = 60;
const DEFAULT_STRESS = 10;

export function TimerCountdown({
  hints,
  seconds = DEFAULT_SECONDS,
  stressAt = DEFAULT_STRESS,
}: TimerCountdownProps) {
  const router = useRouter();
  const { remaining, isRunning } = useCountdown(seconds, { autoStart: true });

  const inStress = remaining <= stressAt && remaining > 0;
  const done = remaining === 0 && !isRunning;

  return (
    <div
      className={cn(
        "fixed inset-0 z-40 flex flex-col items-center justify-center transition-colors duration-500",
        done
          ? "bg-alarm"
          : inStress
            ? "bg-alarm/90 animate-pulse"
            : "bg-ink"
      )}
      aria-live="polite"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center p-6">
        <ol
          className="flex flex-wrap justify-center gap-3 text-sm md:text-base opacity-40"
          aria-label="Tekenbare objecten — herinnering"
        >
          {hints.map((h, i) => (
            <li
              key={i}
              className="rounded-lg border border-paper/30 px-3 py-1"
            >
              {i + 1}. {h}
            </li>
          ))}
        </ol>
      </div>

      {done ? (
        <div className="flex flex-col items-center gap-8 text-center">
          <span className="font-display text-[15vw] font-black leading-none text-paper">
            Tijd is om!
          </span>
          <Button
            variant="ghost"
            size="xl"
            onClick={() => router.push("/")}
            className="bg-paper text-ink hover:bg-paper/90"
          >
            Volgende ronde
            <ArrowRight className="size-6" aria-hidden />
          </Button>
        </div>
      ) : (
        <span
          className={cn(
            "font-display font-black leading-none tabular-nums transition-colors",
            "text-[30vw] md:text-[25vw]",
            "text-paper"
          )}
          aria-label={`${remaining} seconden resterend`}
        >
          {remaining}
        </span>
      )}
    </div>
  );
}
