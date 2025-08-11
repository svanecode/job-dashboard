import { cn } from "@/lib/utils";

type SegmentedProps = {
  value: "normal" | "compact";
  onChange: (value: "normal" | "compact") => void;
  className?: string;
};

export function Segmented({ value, onChange, className }: SegmentedProps) {
  return (
    <div className={cn("inline-flex rounded-lg border border-white/10 overflow-hidden", className)}>
      <button
        type="button"
        onClick={() => onChange("normal")}
        className={cn(
          "h-9 px-3 text-sm font-medium transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-neutral-900",
          value === "normal"
            ? "bg-blue-500/15 text-blue-300 border-blue-500/30"
            : "bg-white/5 text-neutral-300 border-white/10 hover:bg-white/8"
        )}
      >
        Normal
      </button>
      <button
        type="button"
        onClick={() => onChange("compact")}
        className={cn(
          "h-9 px-3 text-sm font-medium transition-colors border-l border-white/10",
          "focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-neutral-900",
          value === "compact"
            ? "bg-blue-500/15 text-blue-300 border-blue-500/30"
            : "bg-white/5 text-neutral-300 border-white/10 hover:bg-white/8"
        )}
      >
        Kompakt
      </button>
    </div>
  );
} 