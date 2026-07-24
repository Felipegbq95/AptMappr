"use client";

import { useState } from "react";
import { ArrowLeft, MapPinned, Trash2, Check, Loader2 } from "lucide-react";
import type { Place, PlaceInput } from "@/lib/types";
import { PLACE_ICONS, newPlaceInput } from "@/lib/types";
import AddressSearch from "./AddressSearch";

interface PlacesPanelProps {
  places: Place[];
  loading: boolean;
  onCreate: (input: PlaceInput) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  onBack: () => void;
  onLocate: (place: Place) => void;
}

export default function PlacesPanel({
  places,
  loading,
  onCreate,
  onRemove,
  onBack,
  onLocate,
}: PlacesPanelProps) {
  const [draft, setDraft] = useState<PlaceInput>(newPlaceInput());
  const [saving, setSaving] = useState(false);
  const hasLocation = !(draft.lat === 0 && draft.lng === 0);

  async function add() {
    if (!draft.label.trim() || !hasLocation) return;
    setSaving(true);
    try {
      await onCreate(draft);
      setDraft(newPlaceInput({ icon: draft.icon }));
    } finally {
      setSaving(false);
    }
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
          <MapPinned className="h-4 w-4" /> Places &amp; commutes
        </span>
      </div>

      <div className="scroll-thin flex-1 space-y-4 overflow-y-auto p-4">
        <p className="text-sm text-slate-500">
          Save the places that matter — work, gym, a friend&apos;s flat — and every apartment shows
          the driving time to each.
        </p>

        {/* Add a place */}
        <div className="space-y-3 rounded-xl border border-slate-200 p-3">
          <div className="flex flex-wrap gap-1.5">
            {PLACE_ICONS.map((icon) => (
              <button
                key={icon}
                onClick={() => setDraft((d) => ({ ...d, icon }))}
                className={`flex h-8 w-8 items-center justify-center rounded-lg border text-base ${
                  draft.icon === icon
                    ? "border-brand-500 bg-brand-50"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                {icon}
              </button>
            ))}
          </div>
          <input
            value={draft.label}
            onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
            placeholder="Label (e.g. Work)"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
          <AddressSearch
            placeholder="Search this place's address…"
            onPick={(r) => setDraft((d) => ({ ...d, address: r.label, lat: r.lat, lng: r.lng }))}
          />
          {hasLocation && (
            <span className="flex items-center gap-1 text-xs text-emerald-600">
              <Check className="h-3.5 w-3.5" /> Location set
            </span>
          )}
          <button
            onClick={add}
            disabled={saving || !draft.label.trim() || !hasLocation}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Add place
          </button>
        </div>

        {/* Existing places */}
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          </div>
        ) : places.length === 0 ? (
          <p className="py-2 text-center text-sm text-slate-400">No places saved yet.</p>
        ) : (
          <ul className="space-y-2">
            {places.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2"
              >
                <span className="text-lg">{p.icon}</span>
                <button onClick={() => onLocate(p)} className="min-w-0 flex-1 text-left">
                  <div className="truncate text-sm font-medium text-slate-800">
                    {p.label || "Place"}
                  </div>
                  <div className="truncate text-xs text-slate-400">{p.address}</div>
                </button>
                <button
                  onClick={() => onRemove(p.id)}
                  className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                  aria-label="Delete place"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
