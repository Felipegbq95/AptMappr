import type { Apartment, ApartmentInput } from "./types";
import { getSupabase, isSupabaseConfigured } from "./supabase";

/**
 * Storage abstraction. Two interchangeable backends implement it:
 *  - LocalStore:    browser localStorage (no config, single device).
 *  - SupabaseStore: Postgres with row-level security (cloud, multi-user).
 * The rest of the app never cares which one is active.
 */
export interface ApartmentStore {
  readonly mode: "local" | "cloud";
  list(): Promise<Apartment[]>;
  create(input: ApartmentInput): Promise<Apartment>;
  update(id: string, patch: Partial<ApartmentInput>): Promise<Apartment>;
  remove(id: string): Promise<void>;
}

const LOCAL_KEY = "aptmappr.apartments.v1";

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `apt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

// --------------------------------------------------------------------------
// Local (browser) storage adapter
// --------------------------------------------------------------------------

class LocalStore implements ApartmentStore {
  readonly mode = "local" as const;

  private read(): Apartment[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(LOCAL_KEY);
      return raw ? (JSON.parse(raw) as Apartment[]) : [];
    } catch {
      return [];
    }
  }

  private write(items: Apartment[]) {
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify(items));
  }

  async list(): Promise<Apartment[]> {
    return this.read()
      .map((a) => ({ ...a, photos: Array.isArray(a.photos) ? a.photos : [] }))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async create(input: ApartmentInput): Promise<Apartment> {
    const now = new Date().toISOString();
    const apartment: Apartment = { ...input, id: uid(), createdAt: now, updatedAt: now };
    const items = this.read();
    items.push(apartment);
    this.write(items);
    return apartment;
  }

  async update(id: string, patch: Partial<ApartmentInput>): Promise<Apartment> {
    const items = this.read();
    const idx = items.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error("Apartment not found");
    const updated: Apartment = { ...items[idx], ...patch, updatedAt: new Date().toISOString() };
    items[idx] = updated;
    this.write(items);
    return updated;
  }

  async remove(id: string): Promise<void> {
    this.write(this.read().filter((a) => a.id !== id));
  }
}

// --------------------------------------------------------------------------
// Supabase (cloud) storage adapter
// --------------------------------------------------------------------------

function rowToApartment(row: Record<string, any>): Apartment {
  return {
    id: row.id,
    title: row.title ?? "",
    address: row.address ?? "",
    lat: Number(row.lat),
    lng: Number(row.lng),
    status: row.status,
    price: row.price === null || row.price === undefined ? null : Number(row.price),
    postingUrl: row.posting_url ?? "",
    whatsapp: row.whatsapp ?? "",
    notes: row.notes ?? "",
    appointmentAt: row.appointment_at ?? null,
    photos: Array.isArray(row.photos) ? row.photos : [],
    bedrooms: row.bedrooms === null || row.bedrooms === undefined ? null : Number(row.bedrooms),
    sizeSqm: row.size_sqm === null || row.size_sqm === undefined ? null : Number(row.size_sqm),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function inputToRow(input: Partial<ApartmentInput>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (input.title !== undefined) row.title = input.title;
  if (input.address !== undefined) row.address = input.address;
  if (input.lat !== undefined) row.lat = input.lat;
  if (input.lng !== undefined) row.lng = input.lng;
  if (input.status !== undefined) row.status = input.status;
  if (input.price !== undefined) row.price = input.price;
  if (input.postingUrl !== undefined) row.posting_url = input.postingUrl;
  if (input.whatsapp !== undefined) row.whatsapp = input.whatsapp;
  if (input.notes !== undefined) row.notes = input.notes;
  if (input.appointmentAt !== undefined) row.appointment_at = input.appointmentAt;
  if (input.photos !== undefined) row.photos = input.photos;
  if (input.bedrooms !== undefined) row.bedrooms = input.bedrooms;
  if (input.sizeSqm !== undefined) row.size_sqm = input.sizeSqm;
  return row;
}

class SupabaseStore implements ApartmentStore {
  readonly mode = "cloud" as const;

  private client() {
    const c = getSupabase();
    if (!c) throw new Error("Supabase is not configured");
    return c;
  }

  private async userId(): Promise<string> {
    const { data } = await this.client().auth.getUser();
    if (!data.user) throw new Error("Not signed in");
    return data.user.id;
  }

  async list(): Promise<Apartment[]> {
    const { data, error } = await this.client()
      .from("apartments")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []).map(rowToApartment);
  }

  async create(input: ApartmentInput): Promise<Apartment> {
    const userId = await this.userId();
    const { data, error } = await this.client()
      .from("apartments")
      .insert({ ...inputToRow(input), user_id: userId })
      .select("*")
      .single();
    if (error) throw error;
    return rowToApartment(data);
  }

  async update(id: string, patch: Partial<ApartmentInput>): Promise<Apartment> {
    const { data, error } = await this.client()
      .from("apartments")
      .update(inputToRow(patch))
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return rowToApartment(data);
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.client().from("apartments").delete().eq("id", id);
    if (error) throw error;
  }
}

let store: ApartmentStore | null = null;

/** Returns the active storage backend (cloud if Supabase is configured). */
export function getStore(): ApartmentStore {
  if (!store) {
    store = isSupabaseConfigured ? new SupabaseStore() : new LocalStore();
  }
  return store;
}
