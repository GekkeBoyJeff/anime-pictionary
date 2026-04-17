import { Flame } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface SocialProofBadgeProps {
  text: string;
  className?: string;
}

export function SocialProofBadge({ text, className }: SocialProofBadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-signal/40 bg-signal/10 px-4 py-1.5 text-sm font-medium text-signal backdrop-blur",
        className
      )}
    >
      <Flame className="size-4" aria-hidden />
      <span>{text}</span>
    </div>
  );
}
