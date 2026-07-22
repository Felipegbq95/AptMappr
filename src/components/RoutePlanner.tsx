"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, Route, LocateFixed, Loader2, X, Flag } from "lucide-react";
import type { Apartment, OptimizedRoute } from "@/lib/types";
import { optimizeRoute, reverseGeocode } from "@/lib/api";
import { hasCoords, isoDay } from "@/lib/utils";

const START_ID = "__start__";

export interface RouteState {
  geometry: [number, number][] | null;
  order: string[] | null;
  start: { lat: number; lng: number } | null;
}

interface RoutePlannerProps {
  apartments: Apartment[];
  routeState: RouteState;
  setRouteState: (s: RouteState) => void;
  onBack: () => void;
  onSelectApartment: (id: string) => void;
}

function formatDistance(m: number): string {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}
function formatDuration(s: number): string {
  const mins = Math.round(s / 60);
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)} h ${mins % 60} min`;
}

export default function RoutePlanner({
  apartments,
  routeState,
  setRouteState,
  onBack,
  onSelectApartment,
}: RoutePlannerProps) {
  const mappable = useMemo(() => apartments.filter(hasCoords), [apartments]);
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(mappable.map((a) => a.id)),
  );
  const [roundTrip, setRoundTrip] = useState(true);
  const [start, setStart] = useState<{ lat: number; lng: number; label: string } | null>(
    routeState.start ? { ...routeState.start, label: "Start point" } : null,
  );
  const [day, setDay] = useState("");
  const [result, setResult] = useState<OptimizedRoute | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const orderedApartments = useMemo(() => {
    if (!result) return [];
    return result.order
      .filter((id) => id !== START_ID)
      .map((id) => mappable.find((a) => a.id === id))
      .filter((a): a is Apartment => Boolean(a));
  }, [result, mappable]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectByDay(d: string) {
    setDay(d);
    if (!d) return;
    setSelected(new Set(mappable.filter((a) => isoDay(a.appointmentAt) === d).map((a) => a.id)));
  }

  async function useMyLocation() {
    if (!navigator.geolocation) {
      setError("Geolocation is not available in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const label = (await reverseGeocode(latitude, longitude)) || "My location";
        const s = { lat: latitude, lng: longitude, label };
        setStart(s);
        setRouteState({ ...routeState, start: { lat: latitude, lng: longitude } });
      },
      () => setError("Could not get your location."),
    );
  }

  async function optimize() {
    setError(null);
    const chosen = mappable.filter((a) => selected.has(a.id));
    const stops = [
      ...(start ? [{ id: START_ID, lat: start.lat, lng: start.lng }] : []),
      ...chosen.map((a) => ({ id: a.id, lat: a.lat, lng: a.lng })),
    ];
    if (stops.length < 2) {
      setError("Pick at least 2 apartments (or a start point plus one apartment).");
      return;
    }
    setBusy(true);
    try {
      const route = await optimizeRoute(stops, { roundTrip });
      setResult(route);
      setRouteState({
        geometry: route.geometry,
        order: route.order.filter((id) => id !== START_ID),
        start: start ? { lat: start.lat, lng: start.lng } : null,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not compute a route.");
    } finally {
      setBusy(false);
    }
  }

  function clearRoute() {
    setResult(null);
    setRouteState({ geometry: null, order: null, start: null });
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
        <button
          onClick={onBack}
          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
          <Route className="h-4 w-4" /> Plan a viewing route
        </span>
      </div>

      <div className="scroll-thin flex-1 space-y-4 overflow-y-auto p-4">
        {mappable.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">
            Add a few apartments with locations first, then come back to plan a route.
          </p>
        ) : (
          <>
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Start point (optional)
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={useMyLocation}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <LocateFixed className="h-4 w-4" /> Use my location
                </button>
                {start && (
                  <span className="flex min-w-0 items-center gap-1 text-xs text-slate-500">
                    <Flag className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{start.label}</span>
                    <button
                      onClick={() => {
                        setStart(null);
                        setRouteState({ ...routeState, start: null });
                      }}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                )}
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={roundTrip}
                onChange={(e) => setRoundTrip(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand-600"
              />
              Return to the start (round trip)
            </label>

            <div className="space-y-1">
              <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Quick pick by viewing day
              </label>
              <input
                type="date"
                value={day}
                onChange={(e) => selectByDay(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Apartments ({selected.size}/{mappable.length})
                </span>
                <div className="flex gap-2 text-xs">
                  <button
                    onClick={() => setSelected(new Set(mappable.map((a) => a.id)))}
                    className="text-brand-600 hover:underline"
                  >
                    All
                  </button>
                  <button
                    onClick={() => setSelected(new Set())}
                    className="text-slate-500 hover:underline"
                  >
                    None
                  </button>
                </div>
              </div>
              <ul className="scroll-thin max-h-48 space-y-1 overflow-y-auto rounded-lg border border-slate-200 p-1">
                {mappable.map((a) => (
                  <li key={a.id}>
                    <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={selected.has(a.id)}
                        onChange={() => toggle(a.id)}
                        className="h-4 w-4 rounded border-slate-300 text-brand-600"
                      />
                      <span className="truncate">{a.title || "Untitled"}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={optimize}
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Route className="h-4 w-4" />}
              {busy ? "Optimizing…" : "Optimize route"}
            </button>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
            )}

            {result && (
              <div className="space-y-3 rounded-xl border border-slate-200 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">Optimized order</span>
                  <button onClick={clearRoute} className="text-xs text-slate-500 hover:underline">
                    Clear
                  </button>
                </div>
                <div className="flex gap-4 text-sm text-slate-600">
                  <span>
                    <strong>{formatDistance(result.distanceMeters)}</strong> total
                  </span>
                  <span>
                    <strong>{formatDuration(result.durationSeconds)}</strong> driving
                  </span>
                </div>
                <ol className="space-y-1">
                  {start && (
                    <li className="flex items-center gap-2 text-sm text-slate-500">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-white">
                        <Flag className="h-3 w-3" />
                      </span>
                      Start
                    </li>
                  )}
                  {orderedApartments.map((a, i) => (
                    <li key={a.id}>
                      <button
                        onClick={() => onSelectApartment(a.id)}
                        className="flex w-full items-center gap-2 rounded-md px-1 py-1 text-left text-sm hover:bg-slate-50"
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                          {i + 1}
                        </span>
                        <span className="truncate text-slate-700">{a.title || "Untitled"}</span>
                      </button>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
