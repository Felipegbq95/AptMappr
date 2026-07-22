"use client";

import { CalendarClock, MapPin } from "lucide-react";
import type { Apartment } from "@/lib/types";
import { STATUS_META } from "@/lib/types";
import { formatDateTime, formatPrice, cn } from "@/lib/utils";

interface ApartmentListProps {
  apartments: Apartment[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function ApartmentList({ apartments, selectedId, onSelect }: ApartmentListProps) {
  if (apartments.length === 0) {
    return (
      <div className="px-4 py-10 text-center text-sm text-slate-400">
        No apartments match. Add one, or clear the filters.
      </div>
    );
  }

  return (
    <ul className="divide-y divide-slate-100">
      {apartments.map((apt) => {
        const meta = STATUS_META[apt.status];
        return (
          <li key={apt.id}>
            <button
              onClick={() => onSelect(apt.id)}
              className={cn(
                "flex w-full items-stretch gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50",
                apt.id === selectedId && "bg-brand-50 hover:bg-brand-50",
              )}
            >
              <span
                className="mt-0.5 w-1 shrink-0 rounded-full"
                style={{ backgroundColor: meta.color }}
              />
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium text-slate-800">
                    {apt.title || "Untitled"}
                  </span>
                  {apt.price !== null && (
                    <span className="shrink-0 text-sm font-semibold text-slate-700">
                      {formatPrice(apt.price)}
                    </span>
                  )}
                </span>
                {apt.address && (
                  <span className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{apt.address}</span>
                  </span>
                )}
                <span className="mt-1 flex items-center gap-2">
                  <span
                    className="rounded-full px-1.5 py-0.5 text-[11px] font-medium"
                    style={{ backgroundColor: `${meta.color}1a`, color: meta.color }}
                  >
                    {meta.label}
                  </span>
                  {apt.appointmentAt && (
                    <span className="flex items-center gap-1 text-[11px] text-amber-600">
                      <CalendarClock className="h-3 w-3" />
                      {formatDateTime(apt.appointmentAt)}
                    </span>
                  )}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
