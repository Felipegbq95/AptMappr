"use client";

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
} from "lucide-react";
import type { Apartment } from "@/lib/types";
import { formatDateTime, formatPrice, normalizeUrl, whatsappLink } from "@/lib/utils";
import StatusPill from "./StatusPill";

interface ApartmentDetailProps {
  apartment: Apartment;
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
  onBack,
  onEdit,
  onLocate,
}: ApartmentDetailProps) {
  const wa = whatsappLink(
    apartment.whatsapp,
    `Hi! I'm interested in the apartment "${apartment.title}".`,
  );
  const listing = normalizeUrl(apartment.postingUrl);

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

        <div className="flex flex-wrap gap-2">
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
