"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  MapPinned,
  Plus,
  MapPin,
  Route as RouteIcon,
  Cloud,
  HardDrive,
  Loader2,
  ChevronUp,
  ChevronDown,
  Building2,
  Download,
} from "lucide-react";
import type { Apartment, ApartmentInput, Place } from "@/lib/types";
import { newApartmentInput } from "@/lib/types";
import { useApartments } from "@/lib/useApartments";
import { usePlaces } from "@/lib/usePlaces";
import { useAuth } from "@/lib/useAuth";
import { reverseGeocode } from "@/lib/api";
import { cn, hasCoords } from "@/lib/utils";
import { defaultFilters, filterAndSortApartments } from "@/lib/filter";
import type { Filters } from "@/lib/filter";
import type { FocusTarget } from "./MapView";
import type { RouteState } from "./RoutePlanner";
import ApartmentList from "./ApartmentList";
import ApartmentDetail from "./ApartmentDetail";
import ApartmentForm from "./ApartmentForm";
import RoutePlanner from "./RoutePlanner";
import PlacesPanel from "./PlacesPanel";
import FilterControls from "./FilterControls";
import BackupModal from "./BackupModal";
import { LoginScreen, SignOutButton } from "./Auth";

// Leaflet only runs in the browser, so load the map with SSR disabled.
const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-slate-200 text-slate-400">
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  ),
});

type View = "list" | "detail" | "route" | "places";

interface FormState {
  mode: "add" | "edit";
  initial: ApartmentInput;
  editingId?: string;
}

const emptyRoute: RouteState = { geometry: null, order: null, start: null };

export default function AppShell() {
  const auth = useAuth();
  const enabled = !auth.cloud || Boolean(auth.session);
  const apts = useApartments(enabled);
  const placesApi = usePlaces(enabled);

  const [view, setView] = useState<View>("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [clickToAdd, setClickToAdd] = useState(false);
  const [draft, setDraft] = useState<{ lat: number; lng: number } | null>(null);
  const [focus, setFocus] = useState<FocusTarget | null>(null);
  const [routeState, setRouteState] = useState<RouteState>(emptyRoute);
  // Mobile only: whether the bottom sheet is expanded (ignored on desktop).
  const [sheetOpen, setSheetOpen] = useState(false);
  const [showBackup, setShowBackup] = useState(false);

  const [filters, setFilters] = useState<Filters>(defaultFilters);

  const filtered = useMemo(
    () => filterAndSortApartments(apts.apartments, filters),
    [apts.apartments, filters],
  );

  const selected = useMemo(
    () => apts.apartments.find((a) => a.id === selectedId) ?? null,
    [apts.apartments, selectedId],
  );

  // Apartments shown on the map: everything when routing, else the filtered set.
  const mapApartments = view === "route" ? apts.apartments : filtered;

  const sheetSummary =
    view === "route"
      ? "Route planner"
      : view === "places"
        ? "Places & commutes"
        : view === "detail" && selected
          ? selected.title || "Apartment"
          : `${apts.apartments.length} apartment${apts.apartments.length === 1 ? "" : "s"}`;

  function focusOn(apt: Apartment) {
    if (!hasCoords(apt)) return;
    setFocus({ lat: apt.lat, lng: apt.lng, nonce: Date.now() });
  }

  function focusPlace(place: Place) {
    if (!hasCoords(place)) return;
    setFocus({ lat: place.lat, lng: place.lng, nonce: Date.now() });
  }

  function handleSelect(id: string) {
    setSelectedId(id);
    const apt = apts.apartments.find((a) => a.id === id);
    if (apt) focusOn(apt);
    if (view !== "route") setView("detail");
    setSheetOpen(true);
  }

  function openAdd() {
    setForm({ mode: "add", initial: newApartmentInput() });
    setClickToAdd(false);
  }

  function startDropPin() {
    setClickToAdd(true);
    setView("list");
    setSheetOpen(false); // reveal the map so the user can tap it
  }

  function cancelDropPin() {
    setClickToAdd(false);
  }

  async function handleMapClick(lat: number, lng: number) {
    if (!clickToAdd) return;
    setClickToAdd(false);
    setDraft({ lat, lng });
    const address = await reverseGeocode(lat, lng);
    setForm({ mode: "add", initial: newApartmentInput({ lat, lng, address }) });
  }

  async function submitForm(input: ApartmentInput) {
    if (form?.mode === "edit" && form.editingId) {
      await apts.update(form.editingId, input);
      setSelectedId(form.editingId);
    } else {
      const created = await apts.create(input);
      setSelectedId(created.id);
    }
    setForm(null);
    setDraft(null);
    setView("detail");
    if (hasCoords(input as Apartment)) {
      setFocus({ lat: input.lat, lng: input.lng, nonce: Date.now() });
    }
  }

  function openEdit(apt: Apartment) {
    const { id, createdAt, updatedAt, ...rest } = apt;
    void id;
    void createdAt;
    void updatedAt;
    setForm({ mode: "edit", initial: rest, editingId: apt.id });
  }

  async function handleDelete(apt: Apartment) {
    if (!window.confirm(`Delete "${apt.title || "this apartment"}"? This cannot be undone.`)) {
      return;
    }
    await apts.remove(apt.id);
    setForm(null);
    setSelectedId(null);
    setView("list");
  }

  async function handleImport(result: {
    apartments: ApartmentInput[];
    places: Parameters<typeof placesApi.create>[0][];
  }) {
    let aptCount = 0;
    let placeCount = 0;
    for (const a of result.apartments) {
      try {
        await apts.create(a);
        aptCount += 1;
      } catch {
        /* skip bad row */
      }
    }
    for (const p of result.places) {
      try {
        await placesApi.create(p);
        placeCount += 1;
      } catch {
        /* skip bad row */
      }
    }
    return { aptCount, placeCount };
  }

  // ---- Render gates -------------------------------------------------------
  if (auth.cloud && auth.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }
  if (auth.cloud && !auth.session) {
    return <LoginScreen />;
  }

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden md:flex">
      {/* Panel: bottom sheet on mobile, left column on desktop */}
      <aside
        className={cn(
          "absolute inset-x-0 bottom-0 z-[1200] flex h-[82dvh] flex-col rounded-t-2xl bg-white shadow-2xl transition-transform duration-300 ease-out",
          "md:static md:z-auto md:h-[100dvh] md:w-[400px] md:max-w-[400px] md:translate-y-0 md:rounded-none md:border-r md:border-slate-200 md:shadow-none",
          sheetOpen ? "translate-y-0" : "translate-y-[calc(82dvh-56px)]",
        )}
      >
        {/* Mobile peek header (tap to expand/collapse) */}
        <button
          onClick={() => setSheetOpen((o) => !o)}
          className="relative flex h-14 w-full shrink-0 items-center justify-between px-4 md:hidden"
        >
          <span className="absolute left-1/2 top-2 h-1.5 w-10 -translate-x-1/2 rounded-full bg-slate-300" />
          <span className="mt-2 truncate text-sm font-semibold text-slate-700">{sheetSummary}</span>
          <span className="mt-2 flex items-center gap-2">
            <span
              onClick={(e) => {
                e.stopPropagation();
                openAdd();
              }}
              className="flex items-center gap-1 rounded-full bg-brand-600 px-2.5 py-1 text-xs font-semibold text-white"
            >
              <Plus className="h-3.5 w-3.5" /> Add
            </span>
            {sheetOpen ? (
              <ChevronDown className="h-4 w-4 text-slate-400" />
            ) : (
              <ChevronUp className="h-4 w-4 text-slate-400" />
            )}
          </span>
        </button>

        {/* Brand + account (shown on mobile too in cloud mode so sign-out is reachable) */}
        <div
          className={cn(
            "items-center gap-2 border-b border-slate-100 px-4 py-3",
            auth.cloud ? "flex" : "hidden md:flex",
          )}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
            <MapPinned className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <div className="font-bold">AptMappr</div>
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              {apts.mode === "cloud" ? (
                <>
                  <Cloud className="h-3 w-3" /> Cloud sync
                </>
              ) : (
                <>
                  <HardDrive className="h-3 w-3" /> Saved on this device
                </>
              )}
            </div>
          </div>
          {auth.cloud && (
            <div className="ml-auto">
              <SignOutButton email={auth.email} />
            </div>
          )}
        </div>

        {/* Primary actions */}
        <div className="grid grid-cols-4 gap-2 border-b border-slate-100 px-3 py-3">
          <button
            onClick={openAdd}
            className="flex flex-col items-center gap-1 rounded-lg bg-brand-600 py-2 text-xs font-semibold text-white hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
          <button
            onClick={startDropPin}
            className={cn(
              "flex flex-col items-center gap-1 rounded-lg border py-2 text-xs font-medium hover:bg-slate-50",
              clickToAdd
                ? "border-brand-500 bg-brand-50 text-brand-700"
                : "border-slate-200 text-slate-700",
            )}
          >
            <MapPin className="h-4 w-4" /> Drop pin
          </button>
          <button
            onClick={() => {
              setView("route");
              setSelectedId(null);
              setSheetOpen(true);
            }}
            className={cn(
              "flex flex-col items-center gap-1 rounded-lg border py-2 text-xs font-medium hover:bg-slate-50",
              view === "route"
                ? "border-brand-500 bg-brand-50 text-brand-700"
                : "border-slate-200 text-slate-700",
            )}
          >
            <RouteIcon className="h-4 w-4" /> Route
          </button>
          <button
            onClick={() => {
              setView("places");
              setSelectedId(null);
              setSheetOpen(true);
            }}
            className={cn(
              "flex flex-col items-center gap-1 rounded-lg border py-2 text-xs font-medium hover:bg-slate-50",
              view === "places"
                ? "border-brand-500 bg-brand-50 text-brand-700"
                : "border-slate-200 text-slate-700",
            )}
          >
            <Building2 className="h-4 w-4" /> Places
          </button>
        </div>

        {/* Body */}
        <div className="flex min-h-0 flex-1 flex-col">
          {view === "route" ? (
            <RoutePlanner
              apartments={apts.apartments}
              places={placesApi.places}
              routeState={routeState}
              setRouteState={setRouteState}
              onBack={() => setView("list")}
              onSelectApartment={handleSelect}
            />
          ) : view === "places" ? (
            <PlacesPanel
              places={placesApi.places}
              loading={placesApi.loading}
              onCreate={async (input) => {
                await placesApi.create(input);
              }}
              onRemove={placesApi.remove}
              onBack={() => setView("list")}
              onLocate={focusPlace}
            />
          ) : view === "detail" && selected ? (
            <ApartmentDetail
              apartment={selected}
              places={placesApi.places}
              onBack={() => setView("list")}
              onEdit={() => openEdit(selected)}
              onLocate={() => focusOn(selected)}
            />
          ) : (
            <>
              <FilterControls
                filters={filters}
                setFilters={(updater) => setFilters(updater)}
                onClear={() => setFilters(defaultFilters())}
              />

              {/* List */}
              <div className="scroll-thin min-h-0 flex-1 overflow-y-auto">
                {apts.loading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                  </div>
                ) : apts.error ? (
                  <p className="px-4 py-10 text-center text-sm text-red-500">{apts.error}</p>
                ) : apts.apartments.length === 0 ? (
                  <div className="px-6 py-12 text-center">
                    <MapPinned className="mx-auto mb-3 h-8 w-8 text-slate-300" />
                    <p className="text-sm font-medium text-slate-600">No apartments yet</p>
                    <p className="mt-1 text-sm text-slate-400">
                      Hit <strong>Add</strong> and search an address, or <strong>Drop pin</strong>{" "}
                      to place one on the map.
                    </p>
                  </div>
                ) : (
                  <ApartmentList
                    apartments={filtered}
                    selectedId={selectedId}
                    onSelect={handleSelect}
                  />
                )}
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2 text-[11px] text-slate-400">
                <span>
                  {apts.apartments.length} saved · {filtered.length} shown
                </span>
                <button
                  onClick={() => setShowBackup(true)}
                  className="flex items-center gap-1 font-medium text-slate-500 hover:text-slate-700"
                >
                  <Download className="h-3 w-3" /> Backup / export
                </button>
              </div>
            </>
          )}
        </div>
      </aside>

      {/* Map: full-screen behind the sheet on mobile, right column on desktop */}
      <main className="absolute inset-0 z-0 md:relative md:z-auto md:min-w-0 md:flex-1">
        {clickToAdd && (
          <div className="pointer-events-none absolute inset-x-0 top-3 z-[500] flex justify-center px-4">
            <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-lg">
              <MapPin className="h-4 w-4" /> Tap the map to drop your pin
              <button
                onClick={cancelDropPin}
                className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-xs hover:bg-white/30"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        <MapView
          apartments={mapApartments}
          selectedId={selectedId}
          onSelect={handleSelect}
          clickToAdd={clickToAdd}
          draft={draft}
          onMapClick={handleMapClick}
          routeGeometry={routeState.geometry}
          routeOrder={routeState.order}
          startPoint={routeState.start}
          places={placesApi.places}
          focus={focus}
        />
      </main>

      {form && (
        <ApartmentForm
          mode={form.mode}
          initial={form.initial}
          onSubmit={submitForm}
          onCancel={() => {
            setForm(null);
            setDraft(null);
          }}
          onDelete={
            form.mode === "edit" && selected ? () => handleDelete(selected) : undefined
          }
        />
      )}

      {showBackup && (
        <BackupModal
          apartments={apts.apartments}
          places={placesApi.places}
          onImport={handleImport}
          onClose={() => setShowBackup(false)}
        />
      )}
    </div>
  );
}
