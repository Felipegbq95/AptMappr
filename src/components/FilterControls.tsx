"use client";

import { useState } from "react";
import { Search, X, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { APARTMENT_STATUSES, STATUS_META } from "@/lib/types";
import type { ApartmentStatus } from "@/lib/types";
import { SORT_OPTIONS, activeFilterCount, hasActiveFilters } from "@/lib/filter";
import type { Filters } from "@/lib/filter";
import { cn } from "@/lib/utils";

interface FilterControlsProps {
  filters: Filters;
  setFilters: (updater: (f: Filters) => Filters) => void;
  onClear: () => void;
}

const numOrNull = (v: string): number | null => (v === "" ? null : Number(v));

export default function FilterControls({ filters, setFilters, onClear }: FilterControlsProps) {
  const [open, setOpen] = useState(false);
  const count = activeFilterCount(filters);

  function toggleStatus(s: ApartmentStatus) {
    setFilters((f) => {
      const statuses = new Set(f.statuses);
      if (statuses.has(s)) statuses.delete(s);
      else statuses.add(s);
      return { ...f, statuses };
    });
  }

  return (
    <div className="space-y-2 border-b border-slate-100 px-3 py-3">
      {/* Search */}
      <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3">
        <Search className="h-4 w-4 text-slate-400" />
        <input
          value={filters.query}
          onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
          placeholder="Search name, address, notes…"
          className="w-full bg-transparent py-2 text-sm outline-none"
        />
        {filters.query && (
          <button
            onClick={() => setFilters((f) => ({ ...f, query: "" }))}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Status chips */}
      <div className="scroll-thin flex gap-1.5 overflow-x-auto pb-1">
        {APARTMENT_STATUSES.map((s) => {
          const active = filters.statuses.has(s);
          const meta = STATUS_META[s];
          return (
            <button
              key={s}
              onClick={() => toggleStatus(s)}
              className={cn(
                "shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                active ? "text-white" : "bg-white text-slate-600",
              )}
              style={
                active
                  ? { backgroundColor: meta.color, borderColor: meta.color }
                  : { borderColor: "#e2e8f0" }
              }
            >
              {meta.label}
            </button>
          );
        })}
      </div>

      {/* Sort + filters toggle */}
      <div className="flex items-center gap-2">
        <div className="flex flex-1 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2">
          <ArrowUpDown className="h-4 w-4 shrink-0 text-slate-400" />
          <select
            value={filters.sort}
            onChange={(e) =>
              setFilters((f) => ({ ...f, sort: e.target.value as Filters["sort"] }))
            }
            className="w-full cursor-pointer bg-transparent py-1.5 text-sm outline-none"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setOpen((o) => !o)}
          className={cn(
            "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium",
            open || count > 0
              ? "border-brand-500 bg-brand-50 text-brand-700"
              : "border-slate-300 text-slate-700 hover:bg-slate-50",
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {count > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
              {count}
            </span>
          )}
        </button>
      </div>

      {/* Expandable price + beds */}
      {open && (
        <div className="space-y-2 rounded-lg bg-slate-50 p-3">
          <div className="flex items-center gap-2">
            <span className="w-14 text-xs font-medium text-slate-500">Rent</span>
            <input
              type="number"
              min={0}
              value={filters.minPrice ?? ""}
              onChange={(e) => setFilters((f) => ({ ...f, minPrice: numOrNull(e.target.value) }))}
              placeholder="min"
              className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-brand-500"
            />
            <span className="text-slate-400">–</span>
            <input
              type="number"
              min={0}
              value={filters.maxPrice ?? ""}
              onChange={(e) => setFilters((f) => ({ ...f, maxPrice: numOrNull(e.target.value) }))}
              placeholder="max"
              className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-brand-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-14 text-xs font-medium text-slate-500">Beds</span>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4].map((n) => {
                const active = filters.minBeds === n;
                return (
                  <button
                    key={n}
                    onClick={() =>
                      setFilters((f) => ({ ...f, minBeds: active ? null : n }))
                    }
                    className={cn(
                      "rounded-md border px-2.5 py-1 text-xs font-medium",
                      active
                        ? "border-brand-500 bg-brand-100 text-brand-700"
                        : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50",
                    )}
                  >
                    {n}+
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {hasActiveFilters(filters) && (
        <button
          onClick={onClear}
          className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700"
        >
          <X className="h-3.5 w-3.5" /> Clear filters
        </button>
      )}
    </div>
  );
}
