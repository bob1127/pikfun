"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const TAIWAN_CENTER = { lat: 23.72, lng: 120.96 };
const TAIWAN_ZOOM = 8;
const MAP_STYLE = { width: "100%", height: "100%" };
const PIN_BLUE = "#2F9BFF";

const OSM_TILE = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

const PIN_STYLES = `
  .pf-court-pin {
    position: relative;
    width: 34px;
    height: 42px;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    display: flex;
    align-items: flex-start;
    justify-content: center;
  }
  .pf-court-pin-pulse {
    position: absolute;
    left: 50%;
    bottom: 1px;
    width: 14px;
    height: 14px;
    border-radius: 9999px;
    background: rgba(47, 155, 255, 0.5);
    transform: translateX(-50%);
    animation: pfCourtPulse 2.2s ease-out infinite;
    pointer-events: none;
  }
  @keyframes pfCourtPulse {
    0% {
      transform: translateX(-50%) scale(0.55);
      opacity: 0.85;
    }
    70% {
      transform: translateX(-50%) scale(2.8);
      opacity: 0;
    }
    100% {
      transform: translateX(-50%) scale(2.8);
      opacity: 0;
    }
  }
  .pf-court-pin-icon {
    filter: drop-shadow(0 6px 12px rgba(30, 110, 220, 0.45));
    transition: transform 0.18s ease;
    transform-origin: 50% 100%;
  }
  .pf-court-pin:hover .pf-court-pin-icon,
  .pf-court-pin.is-active .pf-court-pin-icon {
    transform: scale(1.22);
  }
  .pf-court-leaflet-pin {
    background: none;
    border: none;
  }
  .pf-court-pin-badge {
    position: absolute;
    top: -7px;
    right: -8px;
    min-width: 20px;
    height: 20px;
    padding: 0 5px;
    border-radius: 9999px;
    background: #ffffff;
    color: #111111;
    font-size: 11px;
    font-weight: 800;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.28);
    border: 1px solid rgba(0, 0, 0, 0.08);
    pointer-events: none;
    z-index: 2;
  }
`;

const PIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="${PIN_BLUE}" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="pf-court-pin-icon"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3" fill="#ffffff" stroke="none"/></svg>`;

function buildLeafletPinIcon(active, badgeCount = 0) {
  const badge =
    badgeCount > 0
      ? `<span class="pf-court-pin-badge">${badgeCount}</span>`
      : "";
  return L.divIcon({
    className: "pf-court-leaflet-pin",
    html: `<div class="pf-court-pin${active ? " is-active" : ""}"><span class="pf-court-pin-pulse"></span>${PIN_SVG}${badge}</div>`,
    iconSize: [34, 42],
    iconAnchor: [17, 40],
  });
}

/* ── Leaflet(OSM) 版本：不消耗任何 Google 用量 ── */
function OsmFitView({ courts, fitToCourts }) {
  const map = useMap();

  useEffect(() => {
    const run = () => map.invalidateSize();
    const t1 = setTimeout(run, 50);
    const t2 = setTimeout(run, 300);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [map]);

  useEffect(() => {
    if (fitToCourts && courts.length > 1) {
      const bounds = L.latLngBounds(
        courts.map((c) => [c.latitude, c.longitude]),
      );
      map.fitBounds(bounds, { padding: [56, 56], maxZoom: 14 });
    } else if (fitToCourts && courts.length === 1) {
      map.setView([courts[0].latitude, courts[0].longitude], 14);
    } else {
      map.setView([TAIWAN_CENTER.lat, TAIWAN_CENTER.lng], TAIWAN_ZOOM);
    }
  }, [courts, fitToCourts, map]);

  return null;
}

function OsmCourtsMap({ courts, activeKey, onSelect, fitToCourts, activityCounts }) {
  return (
    <MapContainer
      center={[TAIWAN_CENTER.lat, TAIWAN_CENTER.lng]}
      zoom={TAIWAN_ZOOM}
      scrollWheelZoom
      style={MAP_STYLE}
    >
      <TileLayer attribution={OSM_ATTRIBUTION} url={OSM_TILE} />
      <OsmFitView courts={courts} fitToCourts={fitToCourts} />
      {courts.map((court) => {
        const key = court.place_id || court.id;
        return (
          <Marker
            key={`${key}-${activityCounts?.[key] || 0}`}
            position={[court.latitude, court.longitude]}
            icon={buildLeafletPinIcon(
              activeKey === key,
              activityCounts?.[key] || 0,
            )}
            eventHandlers={{ click: () => onSelect?.(key) }}
          />
        );
      })}
    </MapContainer>
  );
}

export default function CourtsTaiwanMap({
  courts = [],
  activeKey,
  onSelect,
  fitToCourts = false,
  activityCounts = {},
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const osmMap = (
    <OsmCourtsMap
      courts={courts}
      activeKey={activeKey}
      onSelect={onSelect}
      fitToCourts={fitToCourts}
      activityCounts={activityCounts}
    />
  );

  return (
    <>
      <style jsx global>
        {PIN_STYLES}
      </style>
      {osmMap}
    </>
  );
}
