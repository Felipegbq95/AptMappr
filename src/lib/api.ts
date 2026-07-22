import type { GeocodeResult, OptimizedRoute } from "./types";

/** Client helper: search an address via our /api/geocode proxy. */
export async function geocode(query: string): Promise<GeocodeResult[]> {
  const q = query.trim();
  if (!q) return [];
  const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
  if (!res.ok) throw new Error("Address lookup failed");
  return (await res.json()) as GeocodeResult[];
}

/** Client helper: reverse-geocode a dropped pin into an address label. */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const res = await fetch(`/api/geocode?lat=${lat}&lng=${lng}`);
  if (!res.ok) return "";
  const data = (await res.json()) as { label?: string };
  return data.label ?? "";
}

export interface OptimizeStop {
  id: string;
  lat: number;
  lng: number;
}

/**
 * Client helper: ask /api/optimize for the most efficient visiting order of a
 * set of stops. When `roundTrip` is false the route starts at the first stop
 * and ends at the last; otherwise it returns to the start.
 */
export async function optimizeRoute(
  stops: OptimizeStop[],
  opts: { roundTrip?: boolean } = {},
): Promise<OptimizedRoute> {
  const res = await fetch("/api/optimize", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ stops, roundTrip: opts.roundTrip ?? false }),
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || "Route optimization failed");
  }
  return (await res.json()) as OptimizedRoute;
}
