"use client";

import { useCallback, useEffect, useState } from "react";
import type { Apartment, ApartmentInput } from "./types";
import { getStore } from "./storage";

export interface ApartmentsApi {
  apartments: Apartment[];
  loading: boolean;
  error: string | null;
  mode: "local" | "cloud";
  reload: () => Promise<void>;
  create: (input: ApartmentInput) => Promise<Apartment>;
  update: (id: string, patch: Partial<ApartmentInput>) => Promise<Apartment>;
  remove: (id: string) => Promise<void>;
}

/**
 * Loads and mutates apartments through the active storage backend.
 * `enabled` gates loading until we know whether the user is signed in
 * (relevant only in cloud mode).
 */
export function useApartments(enabled: boolean): ApartmentsApi {
  const store = getStore();
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setApartments(await store.list());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load apartments");
    } finally {
      setLoading(false);
    }
  }, [store]);

  useEffect(() => {
    if (!enabled) {
      setApartments([]);
      setLoading(false);
      return;
    }
    void reload();
  }, [enabled, reload]);

  const create = useCallback(
    async (input: ApartmentInput) => {
      const created = await store.create(input);
      setApartments((prev) => [...prev, created]);
      return created;
    },
    [store],
  );

  const update = useCallback(
    async (id: string, patch: Partial<ApartmentInput>) => {
      const updated = await store.update(id, patch);
      setApartments((prev) => prev.map((a) => (a.id === id ? updated : a)));
      return updated;
    },
    [store],
  );

  const remove = useCallback(
    async (id: string) => {
      await store.remove(id);
      setApartments((prev) => prev.filter((a) => a.id !== id));
    },
    [store],
  );

  return { apartments, loading, error, mode: store.mode, reload, create, update, remove };
}
