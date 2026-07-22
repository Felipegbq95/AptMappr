"use client";

import { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Apartment } from "@/lib/types";
import { STATUS_META } from "@/lib/types";
import { hasCoords } from "@/lib/utils";

const TILE_URL =
  process.env.NEXT_PUBLIC_MAP_TILE_URL ||
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

const DEFAULT_CENTER: [number, number] = [40.4168, -3.7038]; // Madrid, a friendly default.

export interface FocusTarget {
  lat: number;
  lng: number;
  zoom?: number;
  /** Nonce so repeated focuses on the same point still fire. */
  nonce: number;
}

interface MapViewProps {
  apartments: Apartment[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  clickToAdd: boolean;
  draft: { lat: number; lng: number } | null;
  onMapClick: (lat: number, lng: number) => void;
  routeGeometry: [number, number][] | null;
  routeOrder: string[] | null;
  startPoint: { lat: number; lng: number } | null;
  focus: FocusTarget | null;
}

function pinSvg(color: string, ring: boolean, label?: string): string {
  const inner = label
    ? `<text x="16" y="15" text-anchor="middle" font-size="13" font-weight="700" fill="#fff" font-family="ui-sans-serif,system-ui">${label}</text>`
    : `<circle cx="16" cy="14" r="4.5" fill="#fff"/>`;
  return `
  <div class="apt-pin-inner">
    <svg width="34" height="46" viewBox="0 0 32 44" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 0C7.7 0 1 6.7 1 15c0 10.5 15 29 15 29s15-18.5 15-29C31 6.7 24.3 0 16 0z"
            fill="${color}" stroke="${ring ? "#0f172a" : "#ffffff"}" stroke-width="${ring ? 3 : 2}"/>
      ${inner}
    </svg>
  </div>`;
}

function makeIcon(color: string, selected: boolean, label?: string): L.DivIcon {
  return L.divIcon({
    className: "apt-pin",
    html: pinSvg(color, selected, label),
    iconSize: [34, 46],
    iconAnchor: [17, 46],
    popupAnchor: [0, -44],
  });
}

const draftIcon = () => makeIcon("#1b6ef5", true, "+");

function homeIcon(): L.DivIcon {
  return L.divIcon({
    className: "apt-pin",
    html: `<div class="apt-pin-inner">
      <svg width="34" height="46" viewBox="0 0 32 44" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 0C7.7 0 1 6.7 1 15c0 10.5 15 29 15 29s15-18.5 15-29C31 6.7 24.3 0 16 0z"
              fill="#0f172a" stroke="#ffffff" stroke-width="2"/>
        <path d="M16 7l7 6v9h-4v-6h-6v6H9v-9z" fill="#fff"/>
      </svg></div>`,
    iconSize: [34, 46],
    iconAnchor: [17, 46],
  });
}

function ClickHandler({
  enabled,
  onMapClick,
}: {
  enabled: boolean;
  onMapClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      if (enabled) onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function FocusController({ focus }: { focus: FocusTarget | null }) {
  const map = useMap();
  useEffect(() => {
    if (!focus) return;
    map.flyTo([focus.lat, focus.lng], focus.zoom ?? Math.max(map.getZoom(), 15), {
      duration: 0.6,
    });
  }, [focus, map]);
  return null;
}

function InitialFit({ apartments }: { apartments: Apartment[] }) {
  const map = useMap();
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    const pts = apartments.filter(hasCoords).map((a) => [a.lat, a.lng] as [number, number]);
    if (pts.length === 0) return;
    done.current = true;
    if (pts.length === 1) {
      map.setView(pts[0], 14);
    } else {
      map.fitBounds(L.latLngBounds(pts).pad(0.2));
    }
  }, [apartments, map]);
  return null;
}

export default function MapView({
  apartments,
  selectedId,
  onSelect,
  clickToAdd,
  draft,
  onMapClick,
  routeGeometry,
  routeOrder,
  startPoint,
  focus,
}: MapViewProps) {
  const orderIndex = useMemo(() => {
    const map = new Map<string, number>();
    routeOrder?.forEach((id, i) => map.set(id, i + 1));
    return map;
  }, [routeOrder]);

  const polyline = useMemo<[number, number][] | null>(() => {
    if (!routeGeometry) return null;
    return routeGeometry.map(([lng, lat]) => [lat, lng]);
  }, [routeGeometry]);

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={12}
      className="h-full w-full"
      zoomControl={false}
      style={{ cursor: clickToAdd ? "crosshair" : undefined }}
    >
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
      <ClickHandler enabled={clickToAdd} onMapClick={onMapClick} />
      <FocusController focus={focus} />
      <InitialFit apartments={apartments} />

      {polyline && (
        <Polyline positions={polyline} pathOptions={{ color: "#1b6ef5", weight: 5, opacity: 0.8 }} />
      )}

      {apartments.filter(hasCoords).map((apt) => {
        const meta = STATUS_META[apt.status];
        const label = orderIndex.get(apt.id);
        return (
          <Marker
            key={apt.id}
            position={[apt.lat, apt.lng]}
            icon={makeIcon(meta.color, apt.id === selectedId, label ? String(label) : undefined)}
            eventHandlers={{ click: () => onSelect(apt.id) }}
          />
        );
      })}

      {startPoint && <Marker position={[startPoint.lat, startPoint.lng]} icon={homeIcon()} />}

      {draft && <Marker position={[draft.lat, draft.lng]} icon={draftIcon()} />}
    </MapContainer>
  );
}
