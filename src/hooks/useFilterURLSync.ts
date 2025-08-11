"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Filters, parseFiltersFromURL, stringifyFiltersToURL } from "@/utils/filters";

export function useFilterURLSync(value: Filters, onChange: (next: Filters) => void, applyOnMount = true) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  // Restore on mount
  useEffect(() => {
    if (!applyOnMount) return;
    const restored = parseFiltersFromURL(sp);
    onChange({ ...value, ...restored });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Push to URL helper
  const push = (next: Filters) => {
    const qs = stringifyFiltersToURL(next);
    router.replace(`${pathname}?${qs}`, { scroll: false });
  };

  return { push };
}

