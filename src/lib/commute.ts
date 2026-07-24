import type { Place } from "./types";

export interface Commute {
  durationSeconds: number;
  distanceMeters: number | null;
}

// Session cache so re-opening the same apartment doesn't refetch.
const cache = new Map<string, Commute>();

const r = (n: number) => n.toFixed(5);
const key = (o: LatLng, p: LatLng) => `${r(o.lat)},${r(o.lng)}->${r(p.lat)},${r(p.lng)}`;

interface LatLng {
  lat: number;
  lng: number;
}

/**
 * Driving commute from one origin to each place. Uses the session cache and
 * fetches only the missing ones in a single /api/commute request. Returns a map
 * keyed by place id; a value of null means the time couldn't be determined.
 */
export async function commutesFor(
  origin: LatLng,
  places: Place[],
): Promise<Record<string, Commute | null>> {
  const result: Record<string, Commute | null> = {};
  const missing: Place[] = [];

  for (const place of places) {
    const cached = cache.get(key(origin, place));
    if (cached) result[place.id] = cached;
    else missing.push(place);
  }

  if (missing.length === 0) return result;

  try {
    const res = await fetch("/api/commute", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        origins: [{ lat: origin.lat, lng: origin.lng }],
        destinations: missing.map((p) => ({ lat: p.lat, lng: p.lng })),
      }),
    });
    if (!res.ok) throw new Error("commute failed");
    const data = (await res.json()) as {
      durations: (number | null)[][];
      distances: (number | null)[][] | null;
    };
    missing.forEach((place, j) => {
      const dur = data.durations?.[0]?.[j];
      if (dur === null || dur === undefined) {
        result[place.id] = null;
        return;
      }
      const commute: Commute = {
        durationSeconds: dur,
        distanceMeters: data.distances?.[0]?.[j] ?? null,
      };
      cache.set(key(origin, place), commute);
      result[place.id] = commute;
    });
  } catch {
    for (const place of missing) result[place.id] = null;
  }

  return result;
}
