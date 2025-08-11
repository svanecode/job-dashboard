export type Region =
  | 'Hovedstaden'
  | 'Sjælland'
  | 'Fyn'
  | 'Syd- og Sønderjylland'
  | 'Midtjylland'
  | 'Nordjylland'
  | 'Udlandet';

export type Score = 1 | 2 | 3;
export type ViewMode = 'normal' | 'compact';

export type Filters = {
  regions: Region[];
  scores: Score[];
  dateFrom?: string; // YYYY-MM-DD
  dateTo?: string; // YYYY-MM-DD
  view: ViewMode;
};

export const ALL_REGIONS: Region[] = [
  'Hovedstaden',
  'Sjælland',
  'Fyn',
  'Syd- og Sønderjylland',
  'Midtjylland',
  'Nordjylland',
  'Udlandet',
];

export function isRegion(value: string): value is Region {
  return (ALL_REGIONS as string[]).includes(value);
}

export function isScore(value: string): value is `${Score}` {
  return ['1', '2', '3'].includes(value);
}

export function coerceScores(values: string[]): Score[] {
  return values
    .map((v) => (isScore(v) ? (parseInt(v, 10) as Score) : undefined))
    .filter((v): v is Score => typeof v === 'number');
}

export function parseFiltersFromURL(search: string | URLSearchParams): Filters {
  const sp = typeof search === 'string' ? new URLSearchParams(search) : search;
  const regions = (sp.get('regions') || '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length)
    .filter(isRegion);
  const scores = coerceScores(
    (sp.get('scores') || '')
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length)
  );
  const dateFrom = sp.get('dateFrom') || undefined;
  const dateTo = sp.get('dateTo') || undefined;
  const view = (sp.get('view') as ViewMode) || 'normal';
  return {
    regions: regions as Region[],
    scores,
    dateFrom,
    dateTo,
    view: view === 'compact' ? 'compact' : 'normal',
  };
}

export function stringifyFiltersToURL(filters: Filters, base?: string): string {
  const sp = new URLSearchParams();
  if (filters.regions?.length) sp.set('regions', filters.regions.join(','));
  if (filters.scores?.length) sp.set('scores', filters.scores.join(','));
  if (filters.dateFrom) sp.set('dateFrom', filters.dateFrom);
  if (filters.dateTo) sp.set('dateTo', filters.dateTo);
  if (filters.view && filters.view !== 'normal') sp.set('view', filters.view);
  const qs = sp.toString();
  if (!base) return `?${qs}`;
  const url = new URL(base, 'http://localhost');
  url.search = qs;
  return `${url.search}`;
}

export function isDefaultFilters(filters: Filters): boolean {
  return (
    (!filters.regions || filters.regions.length === 0) &&
    (!filters.scores || filters.scores.length === 0) &&
    !filters.dateFrom &&
    !filters.dateTo &&
    filters.view === 'normal'
  );
}

export function coerceRegionInput(value: string | string[] | undefined | null): Region[] {
  if (!value) return [];
  const list = Array.isArray(value) ? value : value.split(',');
  return list.map((s) => s.trim()).filter(isRegion);
}

export function coerceRegionField(jobRegion: unknown): Region[] {
  if (!jobRegion) return [];
  if (Array.isArray(jobRegion)) {
    return (jobRegion as string[]).filter(isRegion) as Region[];
  }
  if (typeof jobRegion === 'string') {
    return jobRegion
      .split(',')
      .map((s) => s.trim())
      .filter(isRegion) as Region[];
  }
  return [];
}

