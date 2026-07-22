import { NextResponse } from "next/server";
import type { GeocodeResult } from "@/lib/types";

// Nominatim asks that every app identify itself with a descriptive User-Agent.
const USER_AGENT = "AptMappr/0.1 (apartment-hunting map app)";
const NOMINATIM = process.env.NOMINATIM_URL || "https://nominatim.openstreetmap.org";

export const runtime = "nodejs";
// Cache identical lookups for a day to be gentle on the public service.
export const revalidate = 0;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  try {
    // Reverse geocoding: pin -> address label.
    if (lat && lng) {
      const url = `${NOMINATIM}/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(
        lng,
      )}&format=jsonv2`;
      const res = await fetch(url, {
        headers: { "User-Agent": USER_AGENT, "Accept-Language": "en" },
        next: { revalidate: 86400 },
      });
      if (!res.ok) return NextResponse.json({ label: "" });
      const data = (await res.json()) as { display_name?: string };
      return NextResponse.json({ label: data.display_name ?? "" });
    }

    // Forward geocoding: text -> candidate places.
    if (q) {
      const url = `${NOMINATIM}/search?q=${encodeURIComponent(
        q,
      )}&format=jsonv2&addressdetails=1&limit=6`;
      const res = await fetch(url, {
        headers: { "User-Agent": USER_AGENT, "Accept-Language": "en" },
        next: { revalidate: 86400 },
      });
      if (!res.ok) {
        return NextResponse.json({ error: "Geocoding service error" }, { status: 502 });
      }
      const raw = (await res.json()) as Array<{
        display_name: string;
        lat: string;
        lon: string;
      }>;
      const results: GeocodeResult[] = raw.map((r) => ({
        label: r.display_name,
        lat: Number(r.lat),
        lng: Number(r.lon),
      }));
      return NextResponse.json(results);
    }

    return NextResponse.json({ error: "Provide ?q= or ?lat=&lng=" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Geocoding request failed" }, { status: 502 });
  }
}
