import { cn } from "@/lib/utils";

type PillProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean; };

export function Pill({ active, className, ...props }: PillProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={active}
      className={cn(
        "h-9 px-4 rounded-full text-sm font-medium border transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-neutral-900",
        active
          ? "bg-blue-500/15 text-blue-300 border-blue-500/30"
          : "bg-white/5 text-neutral-300 border-white/10 hover:bg-white/8",
        className
      )}
      {...props}
    />
  );
} 