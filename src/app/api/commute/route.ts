import { NextResponse } from "next/server";

const OSRM = process.env.OSRM_URL || "https://router.project-osrm.org";

export const runtime = "nodejs";

interface Point {
  lat: number;
  lng: number;
}

interface OsrmTableResponse {
  code: string;
  durations?: (number | null)[][];
  distances?: (number | null)[][];
}

/**
 * Returns a driving-time (and, when available, distance) matrix from each
 * origin to each destination, using OSRM's table service in a single request.
 * Body: { origins: Point[], destinations: Point[] }
 * Response: { durations: (number|null)[][], distances: (number|null)[][] | null }
 * (seconds / meters, indexed [originIndex][destinationIndex])
 */
export async function POST(request: Request) {
  let body: { origins?: Point[]; destinations?: Point[] };
  try {
    body = await request.json();
  } catch {
    return new NextResponse("Invalid JSON body", { status: 400 });
  }

  const origins = (body.origins ?? []).filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
  const destinations = (body.destinations ?? []).filter(
    (p) => Number.isFinite(p.lat) && Number.isFinite(p.lng),
  );
  if (origins.length === 0 || destinations.length === 0) {
    return new NextResponse("Need at least one origin and one destination", { status: 400 });
  }
  if (origins.length + destinations.length > 100) {
    return new NextResponse("Too many points", { status: 400 });
  }

  const all = [...origins, ...destinations];
  const coords = all.map((p) => `${p.lng},${p.lat}`).join(";");
  const sources = origins.map((_, i) => i).join(";");
  const dests = destinations.map((_, i) => origins.length + i).join(";");

  const params = new URLSearchParams({
    sources,
    destinations: dests,
    annotations: "duration,distance",
  });
  const url = `${OSRM}/table/v1/driving/${coords}?${params.toString()}`;

  try {
    const res = await fetch(url, { headers: { "User-Agent": "AptMappr/0.1" } });
    if (!res.ok) return new NextResponse("Routing service error", { status: 502 });
    const data = (await res.json()) as OsrmTableResponse;
    if (data.code !== "Ok" || !data.durations) {
      return new NextResponse("Could not compute commute times", { status: 422 });
    }
    return NextResponse.json({
      durations: data.durations,
      distances: data.distances ?? null,
    });
  } catch {
    return new NextResponse("Routing request failed", { status: 502 });
  }
}
