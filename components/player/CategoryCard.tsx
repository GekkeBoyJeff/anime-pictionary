"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";

type CategoryTone = "klassiek" | "modern" | "random";

interface CategoryCardProps {
  label: string;
  subtitle?: string;
  icon: React.ReactNode;
  tone: CategoryTone;
  action: () => Promise<string | null>;
  children?: React.ReactNode;
}

const toneClasses: Record<CategoryTone, string> = {
  klassiek:
    "bg-gradient-to-br from-ink-soft to-ink border-ink-border hover:border-paper/30",
  modern:
    "bg-gradient-to-br from-accent-soft/40 to-ink border-accent/30 hover:border-accent",
  random:
    "relative bg-gradient-to-br from-signal/20 via-accent-soft/40 to-ink border-signal/50 hover:border-signal animate-pulse hover:animate-none shadow-[0_0_40px_-10px_oklch(82%_0.18_90/.8)]",
};

export function CategoryCard({
  label,
  subtitle,
  icon,
  tone,
  action,
  children,
}: CategoryCardProps) {
  const router = useRouter();
  const [isPending, setIsPending] = React.useState(false);

  const handleClick = async () => {
    if (isPending) return;
    setIsPending(true);
    try {
      const result = await action();
      if (result) router.push(result);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-busy={isPending || undefined}
      className={cn(
        "group relative flex flex-col items-start justify-between gap-6 rounded-3xl border-2 p-8 text-left transition-all duration-300 ease-out",
        "min-h-[18rem] md:min-h-[22rem] focus-ring",
        "hover:scale-[1.02] active:scale-[0.99]",
        toneClasses[tone]
      )}
    >
      <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-paper/10 backdrop-blur">
        {icon}
      </span>

      <div className="flex flex-col gap-2">
        {subtitle ? (
          <span className="text-sm font-semibold uppercase tracking-widest text-paper/60">
            {subtitle}
          </span>
        ) : null}
        <span className="font-display text-4xl md:text-6xl font-black leading-none tracking-tight text-paper">
          {label}
        </span>
        {children}
      </div>
    </button>
  );
}
