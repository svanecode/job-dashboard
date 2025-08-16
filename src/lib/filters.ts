export const toggleInArray = <T,>(arr: T[], item: T) =>
  arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item];

export const hasAnyFilter = (f: Filters) =>
  f.location.length > 0 || f.density !== "normal";

export type Region = "Hovedstaden" | "Sjælland" | "Fyn" | "Syd- og Sønderjylland" | "Midtjylland" | "Nordjylland" | "Udlandet";
export type Density = "normal" | "compact";

export type Filters = {
  location: Region[];
  density: Density;
}; 