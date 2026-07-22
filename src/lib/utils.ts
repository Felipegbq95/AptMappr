import type { Apartment } from "./types";

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

export function hasCoords(apt: Apartment): boolean {
  return Number.isFinite(apt.lat) && Number.isFinite(apt.lng) && !(apt.lat === 0 && apt.lng === 0);
}
