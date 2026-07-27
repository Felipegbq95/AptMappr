import type { Apartment, ApartmentInput, Place, PlaceInput } from "./types";
import { APARTMENT_STATUSES, newApartmentInput, newPlaceInput } from "./types";

export interface ImportResult {
  apartments: ApartmentInput[];
  places: PlaceInput[];
}

const BACKUP_VERSION = 1;

// ---- small coercion helpers ----------------------------------------------
function str(v: any): string {
  return v === null || v === undefined ? "" : String(v);
}
function num(v: any): number | null {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function photos(v: any): string[] {
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === "string" && v.trim())
    return v
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean);
  return [];
}

function toApartmentInput(o: any): ApartmentInput {
  const status = APARTMENT_STATUSES.includes(o?.status) ? o.status : "lead";
  return newApartmentInput({
    title: str(o?.title),
    address: str(o?.address),
    lat: num(o?.lat) ?? 0,
    lng: num(o?.lng) ?? 0,
    status,
    price: num(o?.price),
    postingUrl: str(o?.postingUrl ?? o?.posting_url ?? o?.url),
    whatsapp: str(o?.whatsapp),
    notes: str(o?.notes),
    appointmentAt: o?.appointmentAt ?? o?.appointment_at ?? null,
    photos: photos(o?.photos),
    bedrooms: num(o?.bedrooms),
    sizeSqm: num(o?.sizeSqm ?? o?.size_sqm ?? o?.size),
  });
}

function toPlaceInput(o: any): PlaceInput {
  return newPlaceInput({
    label: str(o?.label),
    address: str(o?.address),
    lat: num(o?.lat) ?? 0,
    lng: num(o?.lng) ?? 0,
    icon: str(o?.icon) || "📍",
  });
}

// ---- export ---------------------------------------------------------------

/** Full-fidelity JSON backup of everything. */
export function buildBackupJson(apartments: Apartment[], places: Place[]): string {
  return JSON.stringify(
    { app: "aptmappr", version: BACKUP_VERSION, exportedAt: new Date().toISOString(), apartments, places },
    null,
    2,
  );
}

const CSV_COLUMNS: (keyof Apartment)[] = [
  "title",
  "address",
  "lat",
  "lng",
  "price",
  "bedrooms",
  "sizeSqm",
  "status",
  "appointmentAt",
  "postingUrl",
  "whatsapp",
  "notes",
  "photos",
];

function csvCell(value: unknown): string {
  let s: string;
  if (Array.isArray(value)) s = value.join(" | ");
  else s = value === null || value === undefined ? "" : String(value);
  if (/[",\n\r]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Spreadsheet-friendly CSV of apartments. */
export function apartmentsToCsv(apartments: Apartment[]): string {
  const header = CSV_COLUMNS.join(",");
  const rows = apartments.map((a) => CSV_COLUMNS.map((c) => csvCell(a[c])).join(","));
  return [header, ...rows].join("\r\n");
}

// ---- import ---------------------------------------------------------------

/** Minimal RFC-4180-ish CSV parser (handles quotes, commas, newlines). */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c !== "\r") field += c;
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function fromCsv(text: string): ImportResult {
  const rows = parseCsv(text).filter((r) => r.some((c) => c.trim() !== ""));
  if (rows.length < 2) return { apartments: [], places: [] };
  const header = rows[0].map((h) => h.trim());
  const apartments = rows.slice(1).map((cells) => {
    const obj: Record<string, string> = {};
    header.forEach((key, i) => (obj[key] = cells[i] ?? ""));
    return toApartmentInput(obj);
  });
  return { apartments, places: [] };
}

/**
 * Parse an exported file back into inputs. Detects JSON vs CSV by content /
 * filename. Throws on unrecoverable errors.
 */
export function parseImportFile(filename: string, text: string): ImportResult {
  const trimmed = text.trim();
  const looksJson =
    filename.toLowerCase().endsWith(".json") || trimmed.startsWith("{") || trimmed.startsWith("[");
  if (looksJson) {
    const data = JSON.parse(trimmed);
    const rawApts = Array.isArray(data) ? data : (data.apartments ?? []);
    const rawPlaces = Array.isArray(data) ? [] : (data.places ?? []);
    return {
      apartments: (rawApts as unknown[]).map(toApartmentInput),
      places: (rawPlaces as unknown[]).map(toPlaceInput),
    };
  }
  return fromCsv(text);
}

/** Trigger a browser download of a text file. */
export function downloadTextFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function todayStamp(): string {
  return new Date().toISOString().slice(0, 10);
}
