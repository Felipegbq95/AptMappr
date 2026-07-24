import type { Apartment, ApartmentStatus } from "./types";

export type SortKey = "recent" | "price-asc" | "price-desc" | "viewing" | "name";

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "recent", label: "Recently added" },
  { key: "price-asc", label: "Price: low → high" },
  { key: "price-desc", label: "Price: high → low" },
  { key: "viewing", label: "Soonest viewing" },
  { key: "name", label: "Name (A–Z)" },
];

export interface Filters {
  query: string;
  statuses: Set<ApartmentStatus>;
  minPrice: number | null;
  maxPrice: number | null;
  minBeds: number | null;
  sort: SortKey;
}

export function defaultFilters(): Filters {
  return {
    query: "",
    statuses: new Set(),
    minPrice: null,
    maxPrice: null,
    minBeds: null,
    sort: "recent",
  };
}

/** Count of active constraints beyond search/sort — drives the "Filters" badge. */
export function activeFilterCount(f: Filters): number {
  let n = 0;
  if (f.statuses.size) n += 1;
  if (f.minPrice !== null) n += 1;
  if (f.maxPrice !== null) n += 1;
  if (f.minBeds !== null) n += 1;
  return n;
}

export function hasActiveFilters(f: Filters): boolean {
  return activeFilterCount(f) > 0 || f.query.trim() !== "" || f.sort !== "recent";
}

// Sort helpers that always push "unknown" (null) values to the end.
function byNumberAsc(a: number | null, b: number | null): number {
  if (a === null && b === null) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return a - b;
}

function comparator(sort: SortKey): (a: Apartment, b: Apartment) => number {
  switch (sort) {
    case "price-asc":
      return (a, b) => byNumberAsc(a.price, b.price);
    case "price-desc":
      return (a, b) => byNumberAsc(b.price, a.price);
    case "name":
      return (a, b) => (a.title || "").localeCompare(b.title || "");
    case "viewing":
      return (a, b) => {
        if (!a.appointmentAt && !b.appointmentAt) return 0;
        if (!a.appointmentAt) return 1;
        if (!b.appointmentAt) return -1;
        return a.appointmentAt.localeCompare(b.appointmentAt);
      };
    case "recent":
    default:
      // Newest first.
      return (a, b) => b.createdAt.localeCompare(a.createdAt);
  }
}

export function filterAndSortApartments(apartments: Apartment[], f: Filters): Apartment[] {
  const q = f.query.trim().toLowerCase();
  const filtered = apartments.filter((a) => {
    if (f.statuses.size && !f.statuses.has(a.status)) return false;
    if (
      q &&
      !(
        a.title.toLowerCase().includes(q) ||
        a.address.toLowerCase().includes(q) ||
        a.notes.toLowerCase().includes(q)
      )
    )
      return false;
    if (f.minPrice !== null && (a.price === null || a.price < f.minPrice)) return false;
    if (f.maxPrice !== null && (a.price === null || a.price > f.maxPrice)) return false;
    if (f.minBeds !== null && (a.bedrooms === null || a.bedrooms < f.minBeds)) return false;
    return true;
  });
  return filtered.sort(comparator(f.sort));
}
