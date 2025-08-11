"use client";

import { MapPin, Filter, Calendar, RotateCcw } from "lucide-react";
import { Pill } from "./Pill";
import { Segmented } from "./Segmented";
import { DateRange } from "./DateRange";
import { Filters, toggleInArray, hasAnyFilter } from "@/lib/filters";
import { DateRange as DateRangeType } from "react-day-picker";

type Props = {
  value: Filters;
  onChange: (v: Filters) => void;
  onApply: () => void;
  onReset: () => void;
  className?: string;
};

const REGIONS: Filters["regions"] = [
  "Hovedstaden",
  "Sjælland", 
  "Fyn",
  "Syd- og Sønderjylland",
  "Midtjylland",
  "Nordjylland",
  "Udlandet"
];

const SCORES: Filters["scores"] = [3, 2, 1];

export default function FilterBar({ value, onChange, onApply, onReset, className }: Props) {
  const handleRegionToggle = (region: Filters["regions"][0]) => {
    onChange({ ...value, regions: toggleInArray(value.regions, region) });
  };

  const handleScoreToggle = (score: Filters["scores"][0]) => {
    onChange({ ...value, scores: toggleInArray(value.scores, score) });
  };

  const handleDateRangeChange = (dateRange?: DateRangeType) => {
    onChange({
      ...value,
      dateFrom: dateRange?.from ? dateRange.from.toISOString().split('T')[0] : undefined,
      dateTo: dateRange?.to ? dateRange.to.toISOString().split('T')[0] : undefined
    });
  };

  const handleDensityChange = (density: Filters["density"]) => {
    onChange({ ...value, density });
  };

  const handleReset = () => {
    onChange({
      regions: [],
      scores: [],
      dateFrom: undefined,
      dateTo: undefined,
      density: "normal"
    });
  };

  const currentDateRange: DateRangeType | undefined = value.dateFrom || value.dateTo ? {
    from: value.dateFrom ? new Date(value.dateFrom) : undefined,
    to: value.dateTo ? new Date(value.dateTo) : undefined
  } : undefined;

  return (
    <div className="rounded-xl bg-neutral-900/70 backdrop-blur-xl ring-1 ring-white/10 shadow-lg px-5 py-4 md:px-6 md:py-5">
      <div className="grid grid-cols-12 gap-x-4 gap-y-4 items-start">
        {/* Regions (col-span-12 md:col-span-8) */}
        <div className="col-span-12 md:col-span-8">
          <div className="flex items-center gap-2 mb-2 text-[11px] uppercase tracking-[0.08em] text-neutral-400">
            <MapPin className="size-4" />
            Regioner
          </div>
          <div className="flex flex-wrap gap-2">
            {REGIONS.map((region) => (
              <Pill
                key={region}
                active={value.regions.includes(region)}
                onClick={() => handleRegionToggle(region)}
              >
                {region}
              </Pill>
            ))}
          </div>
        </div>

        {/* Scores (col-span-12 md:col-span-3) */}
        <div className="col-span-12 md:col-span-3">
          <div className="flex items-center gap-2 mb-2 text-[11px] uppercase tracking-[0.08em] text-neutral-400">
            <Filter className="size-4" />
            Scores
          </div>
          <div className="flex flex-wrap gap-2">
            {SCORES.map((score) => (
              <Pill
                key={score}
                active={value.scores.includes(score)}
                onClick={() => handleScoreToggle(score)}
              >
                Score {score}
              </Pill>
            ))}
          </div>
        </div>

        {/* Date (col-span-12 md:col-span-3, placed in col 11 via col-start) */}
        <div className="col-span-12 md:col-span-3 md:col-start-11">
          <div className="flex items-center gap-2 mb-2 text-[11px] uppercase tracking-[0.08em] text-neutral-400">
            <Calendar className="size-4" />
            Dato
          </div>
          <DateRange
            dateRange={currentDateRange}
            onDateRangeChange={handleDateRangeChange}
          />
        </div>

        {/* Density + Apply (col-span-12 md:col-span-2, justify-end) */}
        <div className="col-span-12 md:col-span-2 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleReset}
              className="text-neutral-400 hover:text-neutral-200 text-sm transition-colors"
            >
              Nulstil
            </button>
            <Segmented
              value={value.density}
              onChange={handleDensityChange}
            />
          </div>
          <button
            type="button"
            onClick={onApply}
            className="h-9 px-4 rounded-lg bg-blue-500 text-white hover:bg-blue-500/90 shadow-sm transition-colors w-full"
          >
            Anvend filtre
          </button>
        </div>
      </div>
      
      <div className="mt-3 text-[12px] text-neutral-500">
        {hasAnyFilter(value) ? null : "Ingen filtre aktive"}
      </div>
    </div>
  );
}

