"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Pencil,
  ExternalLink,
  MessageCircle,
  CalendarClock,
  MapPin,
  BedDouble,
  Ruler,
  Wallet,
  Navigation,
  Loader2,
} from "lucide-react";
import type { Apartment, Place } from "@/lib/types";
import {
  formatDateTime,
  formatDistance,
  formatDuration,
  formatPrice,
  hasCoords,
  normalizeUrl,
  whatsappLink,
} from "@/lib/utils";
import { commutesFor, type Commute } from "@/lib/commute";
import StatusPill from "./StatusPill";

interface ApartmentDetailProps {
  apartment: Apartment;
  places: Place[];
  onBack: () => void;
  onEdit: () => void;
  onLocate: () => void;
}

function Row({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 text-sm text-slate-700">
      <span className="mt-0.5 text-slate-400">{icon}</span>
      <span className="min-w-0 break-words">{children}</span>
    </div>
  );
}

export default function ApartmentDetail({
  apartment,
  places,
  onBack,
  onEdit,
  onLocate,
}: ApartmentDetailProps) {
  const [commutes, setCommutes] = useState<Record<string, Commute | null>>({});
  const [commuteLoading, setCommuteLoading] = useState(false);

  const placeKey = places.map((p) => p.id).join(",");
  useEffect(() => {
    if (places.length === 0 || !hasCoords(apartment)) {
      setCommutes({});
      return;
    }
    let active = true;
    setCommuteLoading(true);
    commutesFor({ lat: apartment.lat, lng: apartment.lng }, places)
      .then((res) => active && setCommutes(res))
      .finally(() => active && setCommuteLoading(false));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apartment.id, apartment.lat, apartment.lng, placeKey]);

  const wa = whatsappLink(
    apartment.whatsapp,
    `Hi! I'm interested in the apartment "${apartment.title}".`,
  );
  const listing = normalizeUrl(apartment.postingUrl);
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${apartment.lat},${apartment.lng}`;
  const photos = apartment.photos ?? [];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
        <button
          onClick={onBack}
          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"
          aria-label="Back to list"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="text-sm font-medium text-slate-500">Details</span>
        <button
          onClick={onEdit}
          className="ml-auto flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
        >
          <Pencil className="h-4 w-4" /> Edit
        </button>
      </div>

      <div className="scroll-thin flex-1 space-y-4 overflow-y-auto p-4">
        {photos.length > 0 && (
          <div className="scroll-thin -mx-1 flex gap-2 overflow-x-auto pb-1">
            {photos.map((p, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={`${p}-${i}`}
                src={p}
                alt={`${apartment.title} photo ${i + 1}`}
                className="h-40 w-56 shrink-0 rounded-xl object-cover"
              />
            ))}
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-xl font-semibold leading-tight">{apartment.title}</h2>
            <StatusPill status={apartment.status} />
          </div>
          <button
            onClick={onLocate}
            className="flex items-start gap-1.5 text-left text-sm text-brand-600 hover:underline"
          >
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
            {apartment.address || "Show on map"}
          </button>
        </div>

        <div className="flex flex-wrap gap-x-5 gap-y-2 rounded-xl bg-slate-50 px-4 py-3">
          {apartment.price !== null && (
            <Row icon={<Wallet className="h-4 w-4" />}>
              <strong>{formatPrice(apartment.price)}</strong>/mo
            </Row>
          )}
          {apartment.bedrooms !== null && (
            <Row icon={<BedDouble className="h-4 w-4" />}>{apartment.bedrooms} bed</Row>
          )}
          {apartment.sizeSqm !== null && (
            <Row icon={<Ruler className="h-4 w-4" />}>{apartment.sizeSqm} m²</Row>
          )}
        </div>

        {apartment.appointmentAt && (
          <Row icon={<CalendarClock className="h-4 w-4" />}>
            <span className="font-medium">Viewing:</span> {formatDateTime(apartment.appointmentAt)}
          </Row>
        )}

        {places.length > 0 && (
          <div>
            <h3 className="mb-1.5 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
              Commute
              {commuteLoading && <Loader2 className="h-3 w-3 animate-spin" />}
            </h3>
            <ul className="space-y-1.5">
              {places.map((p) => {
                const c = commutes[p.id];
                return (
                  <li
                    key={p.id}
                    className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
                  >
                    <span className="flex items-center gap-2 text-slate-700">
                      <span>{p.icon}</span>
                      <span className="truncate">{p.label || "Place"}</span>
                    </span>
                    <span className="shrink-0 text-slate-500">
                      {c ? (
                        <>
                          <span className="font-semibold text-slate-700">
                            {formatDuration(c.durationSeconds)}
                          </span>
                          {c.distanceMeters !== null && (
                            <span className="ml-1 text-xs">· {formatDistance(c.distanceMeters)}</span>
                          )}
                        </>
                      ) : commuteLoading ? (
                        "…"
                      ) : (
                        "—"
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <a
            href={directions}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Navigation className="h-4 w-4" /> Directions
          </a>
          {listing && (
            <a
              href={listing}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <ExternalLink className="h-4 w-4" /> Open listing
            </a>
          )}
          {wa && (
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
          )}
        </div>

        {apartment.notes && (
          <div>
            <h3 className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
              Notes
            </h3>
            <p className="whitespace-pre-wrap rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
              {apartment.notes}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
