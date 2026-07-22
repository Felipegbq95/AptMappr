"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Loader2, MapPin } from "lucide-react";
import { geocode } from "@/lib/api";
import type { GeocodeResult } from "@/lib/types";

interface AddressSearchProps {
  placeholder?: string;
  onPick: (result: GeocodeResult) => void;
  /** Initial text shown in the field. */
  initialValue?: string;
}

export default function AddressSearch({ placeholder, onPick, initialValue }: AddressSearchProps) {
  const [query, setQuery] = useState(initialValue ?? "");
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // Debounced geocoding as the user types.
  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await geocode(q);
        if (!cancelled) {
          setResults(res);
          setOpen(true);
        }
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query]);

  // Close the dropdown when clicking outside.
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className="relative" ref={boxRef}>
      <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100">
        <Search className="h-4 w-4 shrink-0 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length && setOpen(true)}
          placeholder={placeholder ?? "Search an address…"}
          className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-slate-400"
        />
        {loading && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-slate-400" />}
      </div>

      {open && results.length > 0 && (
        <ul className="scroll-thin absolute z-[1200] mt-1 max-h-64 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
          {results.map((r, i) => (
            <li key={`${r.lat},${r.lng},${i}`}>
              <button
                type="button"
                onClick={() => {
                  onPick(r);
                  setQuery(r.label);
                  setOpen(false);
                }}
                className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50"
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                <span className="line-clamp-2 text-slate-700">{r.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
