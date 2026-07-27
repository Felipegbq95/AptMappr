import type { Apartment } from "./types";

// Default viewing duration when building a calendar event.
const DURATION_MIN = 45;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** ISO string → iCalendar UTC timestamp (YYYYMMDDTHHMMSSZ). */
function toIcsDate(iso: string): string {
  const d = new Date(iso);
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

/** Escape reserved characters in iCalendar text values. */
function esc(s: string): string {
  return (s || "")
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function vevent(apt: Apartment): string | null {
  if (!apt.appointmentAt) return null;
  const startMs = new Date(apt.appointmentAt).getTime();
  if (Number.isNaN(startMs)) return null;
  const end = new Date(startMs + DURATION_MIN * 60000).toISOString();
  const description = [apt.notes, apt.postingUrl].filter(Boolean).join("\n");
  return [
    "BEGIN:VEVENT",
    `UID:${apt.id}@aptmappr`,
    `DTSTAMP:${toIcsDate(new Date().toISOString())}`,
    `DTSTART:${toIcsDate(apt.appointmentAt)}`,
    `DTEND:${toIcsDate(end)}`,
    `SUMMARY:${esc(`Viewing: ${apt.title || "Apartment"}`)}`,
    apt.address ? `LOCATION:${esc(apt.address)}` : "",
    description ? `DESCRIPTION:${esc(description)}` : "",
    "END:VEVENT",
  ]
    .filter(Boolean)
    .join("\r\n");
}

/** Build a VCALENDAR containing every apartment that has an appointment. */
export function buildCalendar(apartments: Apartment[]): string {
  const events = apartments.map(vevent).filter((e): e is string => e !== null);
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AptMappr//Apartment viewings//EN",
    "CALSCALE:GREGORIAN",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");
}

/** Build a one-event calendar for a single viewing. */
export function buildSingleEvent(apt: Apartment): string {
  return buildCalendar([apt]);
}

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "apartment"
  );
}

export function icsFilename(apt: Apartment): string {
  return `viewing-${slugify(apt.title)}.ics`;
}
