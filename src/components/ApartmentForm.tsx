"use client";

import { useState } from "react";
import { X, Trash2, MapPin, Check } from "lucide-react";
import type { ApartmentInput } from "@/lib/types";
import { APARTMENT_STATUSES, STATUS_META } from "@/lib/types";
import { toLocalInputValue, fromLocalInputValue } from "@/lib/utils";
import AddressSearch from "./AddressSearch";

interface ApartmentFormProps {
  mode: "add" | "edit";
  initial: ApartmentInput;
  onSubmit: (input: ApartmentInput) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => void;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

export default function ApartmentForm({
  mode,
  initial,
  onSubmit,
  onCancel,
  onDelete,
}: ApartmentFormProps) {
  const [form, setForm] = useState<ApartmentInput>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasLocation = !(form.lat === 0 && form.lng === 0);

  function set<K extends keyof ApartmentInput>(key: K, value: ApartmentInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("Give this place a name so you can recognize it.");
      return;
    }
    if (!hasLocation) {
      setError("Search an address (or drop a pin on the map) so it appears on the map.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[1500] flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 sm:items-center">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-2xl bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-semibold">
            {mode === "add" ? "Add apartment" : "Edit apartment"}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="scroll-thin max-h-[70vh] space-y-4 overflow-y-auto px-5 py-4">
          <Field label="Name / title">
            <input
              className={inputClass}
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Sunny 2BR near the park"
              autoFocus
            />
          </Field>

          <Field label="Address">
            <AddressSearch
              initialValue={form.address}
              placeholder="Search address…"
              onPick={(r) =>
                setForm((f) => ({ ...f, address: r.label, lat: r.lat, lng: r.lng }))
              }
            />
            <span
              className={`mt-1 flex items-center gap-1 text-xs ${
                hasLocation ? "text-emerald-600" : "text-slate-400"
              }`}
            >
              {hasLocation ? (
                <>
                  <Check className="h-3.5 w-3.5" /> Located at {form.lat.toFixed(5)},{" "}
                  {form.lng.toFixed(5)}
                </>
              ) : (
                <>
                  <MapPin className="h-3.5 w-3.5" /> No location yet — search above or close and
                  click the map.
                </>
              )}
            </span>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Status">
              <select
                className={inputClass}
                value={form.status}
                onChange={(e) => set("status", e.target.value as ApartmentInput["status"])}
              >
                {APARTMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_META[s].label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Monthly rent">
              <input
                type="number"
                min={0}
                className={inputClass}
                value={form.price ?? ""}
                onChange={(e) => set("price", e.target.value === "" ? null : Number(e.target.value))}
                placeholder="1200"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Bedrooms">
              <input
                type="number"
                min={0}
                className={inputClass}
                value={form.bedrooms ?? ""}
                onChange={(e) =>
                  set("bedrooms", e.target.value === "" ? null : Number(e.target.value))
                }
                placeholder="2"
              />
            </Field>
            <Field label="Size (m²)">
              <input
                type="number"
                min={0}
                className={inputClass}
                value={form.sizeSqm ?? ""}
                onChange={(e) =>
                  set("sizeSqm", e.target.value === "" ? null : Number(e.target.value))
                }
                placeholder="70"
              />
            </Field>
          </div>

          <Field label="Listing URL">
            <input
              className={inputClass}
              value={form.postingUrl}
              onChange={(e) => set("postingUrl", e.target.value)}
              placeholder="https://www.idealista.com/…"
            />
          </Field>

          <Field label="WhatsApp / phone">
            <input
              className={inputClass}
              value={form.whatsapp}
              onChange={(e) => set("whatsapp", e.target.value)}
              placeholder="+34 600 123 456"
            />
          </Field>

          <Field label="Viewing appointment">
            <input
              type="datetime-local"
              className={inputClass}
              value={toLocalInputValue(form.appointmentAt)}
              onChange={(e) => set("appointmentAt", fromLocalInputValue(e.target.value))}
            />
          </Field>

          <Field label="Notes">
            <textarea
              className={`${inputClass} min-h-[90px] resize-y`}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="3rd floor, no elevator. Landlord prefers WhatsApp. Ask about heating…"
            />
          </Field>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-5 py-4">
          {mode === "edit" && onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {saving ? "Saving…" : mode === "add" ? "Add apartment" : "Save changes"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
