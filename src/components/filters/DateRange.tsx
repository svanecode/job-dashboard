"use client";

import * as React from "react";
import { format } from "date-fns";
import { da } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DateRangeProps {
  dateRange?: DateRange;
  onDateRangeChange: (range?: DateRange) => void;
  className?: string;
}

export function DateRange({ dateRange, onDateRangeChange, className }: DateRangeProps) {
  const displayLabel = React.useMemo(() => {
    if (dateRange?.from && dateRange?.to) {
      return `${format(dateRange.from, "dd-MM-yyyy", { locale: da })} — ${format(dateRange.to, "dd-MM-yyyy", { locale: da })}`;
    }
    if (dateRange?.from) {
      return format(dateRange.from, "dd-MM-yyyy", { locale: da });
    }
    return "Alle datoer";
  }, [dateRange]);

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              "h-9 rounded-lg bg-white/5 border border-white/10 text-neutral-300 px-3 w-full justify-start text-left font-normal",
              !dateRange?.from && "text-neutral-400"
            )}
            aria-label={dateRange?.from ? `Valgt datointerval: ${displayLabel}` : "Vælg datointerval"}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {displayLabel}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-neutral-900 border border-white/10 rounded-xl shadow-lg" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from}
            selected={dateRange}
            onSelect={onDateRangeChange}
            numberOfMonths={2}
            locale={da}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
} 