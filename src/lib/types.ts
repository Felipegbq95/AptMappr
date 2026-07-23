// Domain model for AptMappr.

export const APARTMENT_STATUSES = [
  "lead",
  "contacted",
  "scheduled",
  "visited",
  "favorite",
  "rejected",
] as const;

export type ApartmentStatus = (typeof APARTMENT_STATUSES)[number];

export const STATUS_META: Record<
  ApartmentStatus,
  { label: string; color: string; description: string }
> = {
  lead: { label: "Lead", color: "#64748b", description: "Found it, not contacted yet" },
  contacted: { label: "Contacted", color: "#0ea5e9", description: "Reached out to the lister" },
  scheduled: { label: "Scheduled", color: "#f59e0b", description: "Viewing booked" },
  visited: { label: "Visited", color: "#8b5cf6", description: "Already saw it" },
  favorite: { label: "Favorite", color: "#22c55e", description: "A top contender" },
  rejected: { label: "Rejected", color: "#ef4444", description: "Ruled out" },
};

export interface Apartment {
  id: string;
  title: string;
  address: string;
  lat: number;
  lng: number;
  status: ApartmentStatus;
  /** Monthly rent (currency-agnostic number). */
  price: number | null;
  /** URL of the original posting (Idealista, Zillow, Facebook Marketplace, etc.). */
  postingUrl: string;
  /** Phone in international format, used to build a WhatsApp deep link. */
  whatsapp: string;
  /** Free-form notes (markdown-ish plain text). */
  notes: string;
  /** ISO date-time of the viewing appointment, if any. */
  appointmentAt: string | null;
  /** Photo URLs (remote links, or downscaled data URLs in local mode). */
  photos: string[];
  /** Optional extra structured fields shown in the detail panel. */
  bedrooms: number | null;
  sizeSqm: number | null;
  createdAt: string;
  updatedAt: string;
}

export type ApartmentInput = Omit<Apartment, "id" | "createdAt" | "updatedAt">;

/** A geocoding search result. */
export interface GeocodeResult {
  label: string;
  lat: number;
  lng: number;
}

/** An optimized viewing route returned by the route optimizer. */
export interface OptimizedRoute {
  /** Apartment ids in the order they should be visited. */
  order: string[];
  /** GeoJSON-style [lng, lat] coordinates of the road-following polyline. */
  geometry: [number, number][];
  distanceMeters: number;
  durationSeconds: number;
}

export function newApartmentInput(partial: Partial<ApartmentInput> = {}): ApartmentInput {
  return {
    title: "",
    address: "",
    lat: 0,
    lng: 0,
    status: "lead",
    price: null,
    postingUrl: "",
    whatsapp: "",
    notes: "",
    appointmentAt: null,
    photos: [],
    bedrooms: null,
    sizeSqm: null,
    ...partial,
  };
}
