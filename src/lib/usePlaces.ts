"use client";

import { useCallback, useEffect, useState } from "react";
import type { Place, PlaceInput } from "./types";
import { getPlaceStore } from "./storage";

export interface PlacesApi {
  places: Place[];
  loading: boolean;
  create: (input: PlaceInput) => Promise<Place>;
  update: (id: string, patch: Partial<PlaceInput>) => Promise<Place>;
  remove: (id: string) => Promise<void>;
}

/** Loads and mutates saved places (commute anchors). */
export function usePlaces(enabled: boolean): PlacesApi {
  const store = getPlaceStore();
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!enabled) {
      setPlaces([]);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    store
      .list()
      .then((p) => active && setPlaces(p))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [enabled, store]);

  const create = useCallback(
    async (input: PlaceInput) => {
      const created = await store.create(input);
      setPlaces((prev) => [...prev, created]);
      return created;
    },
    [store],
  );

  const update = useCallback(
    async (id: string, patch: Partial<PlaceInput>) => {
      const updated = await store.update(id, patch);
      setPlaces((prev) => prev.map((p) => (p.id === id ? updated : p)));
      return updated;
    },
    [store],
  );

  const remove = useCallback(
    async (id: string) => {
      await store.remove(id);
      setPlaces((prev) => prev.filter((p) => p.id !== id));
    },
    [store],
  );

  return { places, loading, create, update, remove };
}
