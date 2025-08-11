"use client";

import { motion } from "framer-motion";
import { cn } from "@/utils/cn";

export type FilterChipProps = {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  ariaLabel?: string;
};

export function FilterChip({ active, children, onClick, className, ariaLabel }: FilterChipProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      role="button"
      aria-pressed={!!active}
      aria-label={ariaLabel}
      className={cn(
        "h-8 px-3 rounded-xl text-sm border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20",
        "bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10",
        active && "data-[state=on]:bg-white/10 data-[state=on]:border-white/20 bg-white/10 border-white/20 text-neutral-100",
        className
      )}
      data-state={active ? "on" : "off"}
    >
      {children}
    </motion.button>
  );
}

