import { cn } from "@/lib/utils/cn";

interface InspirationGridProps {
  hints: readonly [string, string, string];
  className?: string;
}

export function InspirationGrid({ hints, className }: InspirationGridProps) {
  return (
    <ul
      className={cn(
        "grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6",
        className
      )}
      aria-label="Tekenbare objecten"
    >
      {hints.map((hint, index) => (
        <li
          key={hint}
          className={cn(
            "relative overflow-hidden rounded-2xl border border-ink-border bg-ink-soft/60 p-6 md:p-8",
            "flex flex-col gap-4",
            "transition-[transform,border-color] duration-300 hover:-translate-y-1 hover:border-accent/60"
          )}
        >
          <span
            aria-hidden
            className="font-display text-7xl md:text-8xl font-black leading-none text-accent/30"
          >
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="font-display text-2xl md:text-3xl font-bold leading-tight tracking-tight text-paper">
            {hint}
          </span>
        </li>
      ))}
    </ul>
  );
}
