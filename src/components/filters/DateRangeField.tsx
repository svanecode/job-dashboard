"use client";

import { useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/utils/cn";

export type DateRange = { from?: string; to?: string };

type Props = {
  value?: DateRange;
  onChange?: (range: DateRange) => void;
  className?: string;
};

// Placeholder for shadcn Popover+Calendar integration. Keeps API and ARIA right now.
export function DateRangeField({ value, onChange, className }: Props) {
  const [open, setOpen] = useState(false);
  const label = value?.from || value?.to ? `${value?.from || ""} – ${value?.to || ""}` : "Alle datoer";
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <CalendarIcon className="size-4 text-neutral-400" />
      <button
        type="button"
        aria-expanded={open}
        aria-label={`Vælg dato interval: ${label}`}
        onClick={() => setOpen((v) => !v)}
        className="h-8 px-3 rounded-xl text-sm bg-white/5 border border-white/10 text-neutral-300 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
      >
        {label}
      </button>
      {/* Implementer Popover + Calendar her efter behov */}
    </div>
  );
}

