"use client";

import { cn } from "@/utils/cn";

export function ScoreChip({ score, className }: { score: 1 | 2 | 3; className?: string }) {
  const styles =
    score === 3
      ? "bg-green-500/15 text-green-300 border border-green-500/30"
      : score === 2
      ? "bg-yellow-500/15 text-yellow-300 border border-yellow-500/30"
      : "bg-blue-500/15 text-blue-300 border border-blue-500/30";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium",
        styles,
        className
      )}
      aria-label={`Score ${score}`}
    >
      Score {score}
    </span>
  );
}

