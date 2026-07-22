import { NextResponse } from "next/server";
import type { OptimizedRoute } from "@/lib/types";

const OSRM = process.env.OSRM_URL || "https://router.project-osrm.org";

export const runtime = "nodejs";

interface Stop {
  id: string;
  lat: number;
  lng: number;
}

interface OsrmTripResponse {
  code: string;
  message?: string;
  trips?: Array<{
    distance: number;
    duration: number;
    geometry: { coordinates: [number, number][] };
  }>;
  waypoints?: Array<{ waypoint_index: number }>;
}

export async function POST(request: Request) {
  let body: { stops?: Stop[]; roundTrip?: boolean };
  try {
    body = await request.json();
  } catch {
    return new NextResponse("Invalid JSON body", { status: 400 });
  }

  const stops = (body.stops ?? []).filter(
    (s) => s && Number.isFinite(s.lat) && Number.isFinite(s.lng),
  );
  if (stops.length < 2) {
    return new NextResponse("Need at least 2 stops to plan a route", { status: 400 });
  }
  if (stops.length > 100) {
    return new NextResponse("Too many stops (max 100)", { status: 400 });
  }

  const roundTrip = body.roundTrip ?? false;
  const coords = stops.map((s) => `${s.lng},${s.lat}`).join(";");

  // OSRM's trip service solves the Travelling Salesman Problem over the stops.
  // Only certain roundtrip/source/destination combinations are supported:
  //   round trip -> roundtrip=true&source=first (loop back to the start)
  //   one way    -> roundtrip=false&source=first&destination=last
  const params = new URLSearchParams({
    geometries: "geojson",
    overview: "full",
    source: "first",
  });
  if (roundTrip) {
    params.set("roundtrip", "true");
  } else {
    params.set("roundtrip", "false");
    params.set("destination", "last");
  }

  const url = `${OSRM}/trip/v1/driving/${coords}?${params.toString()}`;

  try {
    const res = await fetch(url, { headers: { "User-Agent": "AptMappr/0.1" } });
    if (!res.ok) {
      return new NextResponse("Routing service error", { status: 502 });
    }
    const data = (await res.json()) as OsrmTripResponse;
    if (data.code !== "Ok" || !data.trips?.length || !data.waypoints) {
      return new NextResponse(data.message || "Could not compute a route", { status: 422 });
    }

    // waypoints[i].waypoint_index is the position of input stop i in the
    // optimized order. Invert that to get ids in visiting order.
    const order: string[] = new Array(stops.length);
    data.waypoints.forEach((wp, i) => {
      order[wp.waypoint_index] = stops[i].id;
    });

    const trip = data.trips[0];
    const result: OptimizedRoute = {
      order,
      geometry: trip.geometry.coordinates,
      distanceMeters: trip.distance,
      durationSeconds: trip.duration,
    };
    return NextResponse.json(result);
  } catch {
    return new NextResponse("Routing request failed", { status: 502 });
  }
}
