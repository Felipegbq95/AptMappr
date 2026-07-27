/** Tiny classnames helper (avoids a clsx dependency). */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/**
 * Build a WhatsApp deep link from a phone number. Strips everything but digits
 * and a leading +, then uses the wa.me short link. An optional prefilled
 * message can be attached.
 */
export function whatsappLink(phone: string, message?: string): string | null {
  const digits = phone.replace(/[^\d]/g, "");
  if (digits.length < 6) return null;
  const base = `https://wa.me/${digits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/** Normalize a user-typed URL so it always has a scheme. */
export function normalizeUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function formatPrice(price: number | null): string {
  if (price === null || Number.isNaN(price)) return "";
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(price);
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** For grouping tours by calendar day: YYYY-MM-DD of an ISO datetime. */
export function isoDay(iso: string | null): string | null {
  if (!iso) return null;
  return iso.slice(0, 10);
}

/** Local YYYY-MM-DD for a Date (respects the user's timezone). */
export function localDayKey(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Just the time, e.g. "09:30". */
export function formatTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

/** Friendly day heading: "Today", "Tomorrow", or e.g. "Monday, Jul 27". */
export function formatDayLabel(dayKey: string): string {
  const now = new Date();
  const today = localDayKey(now);
  const tomorrow = localDayKey(new Date(now.getTime() + 86400000));
  if (dayKey === today) return "Today";
  if (dayKey === tomorrow) return "Tomorrow";
  const d = new Date(`${dayKey}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dayKey;
  return d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
}

/**
 * Convert an ISO string to the value format required by
 * <input type="datetime-local"> (local time, no seconds/zone).
 */
export function toLocalInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

/** Inverse of toLocalInputValue: datetime-local value -> ISO string. */
export function fromLocalInputValue(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

/**
 * Build a Google Maps directions URL for a multi-stop route (in visiting
 * order) so the user can navigate the whole day on their phone. When roundTrip
 * is true the route returns to the first stop.
 */
export function googleMapsRouteUrl(
  seq: { lat: number; lng: number }[],
  roundTrip: boolean,
): string | null {
  if (seq.length < 2) return null;
  const c = (p: { lat: number; lng: number }) => `${p.lat},${p.lng}`;
  const origin = seq[0];
  const destination = roundTrip ? seq[0] : seq[seq.length - 1];
  const middle = roundTrip ? seq.slice(1) : seq.slice(1, -1);
  const params = new URLSearchParams({
    api: "1",
    origin: c(origin),
    destination: c(destination),
    travelmode: "driving",
  });
  if (middle.length > 0) params.set("waypoints", middle.map(c).join("|"));
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

/** Human-readable distance from meters (e.g. "850 m", "3.2 km"). */
export function formatDistance(meters: number | null): string {
  if (meters === null || Number.isNaN(meters)) return "";
  return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`;
}

/** Human-readable duration from seconds (e.g. "12 min", "1 h 5 min"). */
export function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 1) return "<1 min";
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)} h ${mins % 60} min`;
}

/** Haversine distance in kilometers, used for quick "nearby" hints. */
export function haversineKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const lat1 = (a[0] * Math.PI) / 180;
  const lat2 = (b[0] * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function hasCoords(item: { lat: number; lng: number }): boolean {
  return (
    Number.isFinite(item.lat) &&
    Number.isFinite(item.lng) &&
    !(item.lat === 0 && item.lng === 0)
  );
}
