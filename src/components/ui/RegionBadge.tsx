"use client";

import { cn } from "@/utils/cn";

export function RegionBadge({ label, className }: { label: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-neutral-300",
        className
      )}
      aria-label={`Region ${label}`}
    >
      {label}
    </span>
  );
}

