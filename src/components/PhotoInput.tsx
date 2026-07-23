"use client";

import { useRef, useState } from "react";
import { ImagePlus, Link2, X, Loader2 } from "lucide-react";
import { uploadPhotos } from "@/lib/photos";
import { normalizeUrl } from "@/lib/utils";

interface PhotoInputProps {
  photos: string[];
  onChange: (photos: string[]) => void;
}

export default function PhotoInput({ photos, onChange }: PhotoInputProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const added = await uploadPhotos(Array.from(files));
      onChange([...photos, ...added]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add photos.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function addUrl() {
    const normalized = normalizeUrl(url);
    if (!normalized) return;
    onChange([...photos, normalized]);
    setUrl("");
  }

  function remove(i: number) {
    onChange(photos.filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-2">
      {photos.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {photos.map((p, i) => (
            <div key={`${p}-${i}`} className="group relative aspect-square overflow-hidden rounded-lg bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute right-1 top-1 rounded-full bg-slate-900/60 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
                aria-label="Remove photo"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
          {busy ? "Uploading…" : "Upload"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="flex min-w-[180px] flex-1 items-center gap-1 rounded-lg border border-slate-300 px-2">
          <Link2 className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addUrl();
              }
            }}
            placeholder="…or paste an image URL"
            className="w-full bg-transparent py-1.5 text-sm outline-none"
          />
          {url && (
            <button
              type="button"
              onClick={addUrl}
              className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold text-brand-600 hover:bg-brand-50"
            >
              Add
            </button>
          )}
        </div>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
