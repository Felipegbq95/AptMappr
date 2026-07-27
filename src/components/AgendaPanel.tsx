"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, CalendarDays, CalendarPlus, Download, MapPin, ChevronDown } from "lucide-react";
import type { Apartment } from "@/lib/types";
import { formatTime, formatDayLabel, localDayKey } from "@/lib/utils";
import { buildCalendar, buildSingleEvent, icsFilename } from "@/lib/ics";
import { downloadTextFile } from "@/lib/backup";
import StatusPill from "./StatusPill";

interface AgendaPanelProps {
  apartments: Apartment[];
  onBack: () => void;
  onSelect: (id: string) => void;
}

interface DayGroup {
  key: string;
  items: Apartment[];
}

function groupByDay(items: Apartment[]): DayGroup[] {
  const map = new Map<string, Apartment[]>();
  for (const a of items) {
    const key = localDayKey(new Date(a.appointmentAt as string));
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(a);
  }
  return [...map.entries()].map(([key, list]) => ({ key, items: list }));
}

function addToCalendar(apt: Apartment) {
  downloadTextFile(icsFilename(apt), buildSingleEvent(apt), "text/calendar");
}

function ViewingRow({ apt, onSelect }: { apt: Apartment; onSelect: (id: string) => void }) {
  return (
    <li className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-50">
      <span className="w-12 shrink-0 text-sm font-semibold text-slate-700">
        {formatTime(apt.appointmentAt)}
      </span>
      <button onClick={() => onSelect(apt.id)} className="min-w-0 flex-1 text-left">
        <span className="flex items-center gap-2">
          <span className="truncate font-medium text-slate-800">{apt.title || "Untitled"}</span>
          <StatusPill status={apt.status} />
        </span>
        {apt.address && (
          <span className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{apt.address}</span>
          </span>
        )}
      </button>
      <button
        onClick={() => addToCalendar(apt)}
        title="Add to calendar (.ics)"
        className="shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-brand-50 hover:text-brand-600"
      >
        <CalendarPlus className="h-4 w-4" />
      </button>
    </li>
  );
}

export default function AgendaPanel({ apartments, onBack, onSelect }: AgendaPanelProps) {
  const [showPast, setShowPast] = useState(false);

  const { upcoming, past, total } = useMemo(() => {
    const withDate = apartments
      .filter((a) => a.appointmentAt)
      .sort((a, b) => (a.appointmentAt as string).localeCompare(b.appointmentAt as string));
    const todayKey = localDayKey(new Date());
    const up = withDate.filter((a) => localDayKey(new Date(a.appointmentAt as string)) >= todayKey);
    const pa = withDate
      .filter((a) => localDayKey(new Date(a.appointmentAt as string)) < todayKey)
      .reverse();
    return { upcoming: groupByDay(up), past: pa, total: withDate.length };
  }, [apartments]);

  function exportAll() {
    const all = apartments.filter((a) => a.appointmentAt);
    downloadTextFile("aptmappr-viewings.ics", buildCalendar(all), "text/calendar");
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
          <CalendarDays className="h-4 w-4" /> Agenda
        </span>
        {total > 0 && (
          <button
            onClick={exportAll}
            className="ml-auto flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
          >
            <Download className="h-3.5 w-3.5" /> Export all
          </button>
        )}
      </div>

      <div className="scroll-thin flex-1 overflow-y-auto p-3">
        {total === 0 ? (
          <div className="px-4 py-12 text-center">
            <CalendarDays className="mx-auto mb-3 h-8 w-8 text-slate-300" />
            <p className="text-sm font-medium text-slate-600">No viewings scheduled</p>
            <p className="mt-1 text-sm text-slate-400">
              Set a viewing appointment on an apartment and it&apos;ll show up here.
            </p>
          </div>
        ) : (
          <>
            {upcoming.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-slate-400">
                No upcoming viewings.
              </p>
            ) : (
              upcoming.map((group) => (
                <div key={group.key} className="mb-3">
                  <h3 className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {formatDayLabel(group.key)}
                  </h3>
                  <ul>
                    {group.items.map((apt) => (
                      <ViewingRow key={apt.id} apt={apt} onSelect={onSelect} />
                    ))}
                  </ul>
                </div>
              ))
            )}

            {past.length > 0 && (
              <div className="mt-2 border-t border-slate-100 pt-2">
                <button
                  onClick={() => setShowPast((v) => !v)}
                  className="flex w-full items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700"
                >
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${showPast ? "" : "-rotate-90"}`}
                  />
                  {past.length} earlier viewing{past.length === 1 ? "" : "s"}
                </button>
                {showPast && (
                  <ul className="opacity-70">
                    {past.map((apt) => (
                      <ViewingRow key={apt.id} apt={apt} onSelect={onSelect} />
                    ))}
                  </ul>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
