"use client";

import { useRef, useState } from "react";
import { X, Download, Upload, FileJson, FileSpreadsheet, Loader2, Check } from "lucide-react";
import type { Apartment, Place } from "@/lib/types";
import {
  apartmentsToCsv,
  buildBackupJson,
  downloadTextFile,
  parseImportFile,
  todayStamp,
} from "@/lib/backup";

interface BackupModalProps {
  apartments: Apartment[];
  places: Place[];
  onImport: (result: {
    apartments: ReturnType<typeof parseImportFile>["apartments"];
    places: ReturnType<typeof parseImportFile>["places"];
  }) => Promise<{ aptCount: number; placeCount: number }>;
  onClose: () => void;
}

export default function BackupModal({ apartments, places, onImport, onClose }: BackupModalProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  function exportJson() {
    downloadTextFile(
      `aptmappr-backup-${todayStamp()}.json`,
      buildBackupJson(apartments, places),
      "application/json",
    );
  }

  function exportCsv() {
    downloadTextFile(
      `aptmappr-apartments-${todayStamp()}.csv`,
      apartmentsToCsv(apartments),
      "text/csv",
    );
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setMessage(null);
    try {
      const text = await file.text();
      const parsed = parseImportFile(file.name, text);
      if (parsed.apartments.length === 0 && parsed.places.length === 0) {
        setMessage({ kind: "err", text: "No apartments or places found in that file." });
        return;
      }
      const { aptCount, placeCount } = await onImport(parsed);
      const parts = [
        `${aptCount} apartment${aptCount === 1 ? "" : "s"}`,
        placeCount ? `${placeCount} place${placeCount === 1 ? "" : "s"}` : "",
      ].filter(Boolean);
      setMessage({ kind: "ok", text: `Imported ${parts.join(" and ")}.` });
    } catch (e) {
      setMessage({
        kind: "err",
        text: e instanceof Error ? `Couldn't import: ${e.message}` : "Import failed.",
      });
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="fixed inset-0 z-[1600] flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-semibold">Backup &amp; export</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-5 py-4">
          <div>
            <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
              <Download className="h-4 w-4" /> Export
            </h3>
            <p className="mb-3 text-xs text-slate-500">
              {apartments.length} apartment{apartments.length === 1 ? "" : "s"} and {places.length}{" "}
              place{places.length === 1 ? "" : "s"} saved.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={exportJson}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <FileJson className="h-4 w-4" /> Backup (.json)
              </button>
              <button
                onClick={exportCsv}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <FileSpreadsheet className="h-4 w-4" /> Apartments (.csv)
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              The <strong>.json</strong> backup restores everything (photos, places included). The{" "}
              <strong>.csv</strong> opens in any spreadsheet.
            </p>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
              <Upload className="h-4 w-4" /> Import
            </h3>
            <p className="mb-3 text-xs text-slate-500">
              Load a previously exported <strong>.json</strong> or <strong>.csv</strong> file.
              Imported items are <strong>added</strong> to your current list.
            </p>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Choose file…
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".json,.csv,application/json,text/csv"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </div>

          {message && (
            <p
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm ${
                message.kind === "ok"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {message.kind === "ok" && <Check className="h-4 w-4" />}
              {message.text}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
