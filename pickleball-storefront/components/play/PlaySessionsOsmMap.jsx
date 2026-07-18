"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { useTranslation } from "next-i18next";
import { Users } from "lucide-react";
import "leaflet/dist/leaflet.css";
import {
  MapInfoContent,
  MapEmptyHint,
  MapShell,
  MapToolbar,
  TAIWAN_CENTER,
  useSessionMapGroups,
} from "@/components/play/map/SessionMapShared";
import {
  buildCircleMarkerHtml,
  getGroupMarkerMeta,
} from "@/components/play/map/markerUtils";

const OSM_TILE = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

function createCircleMarkerIcon(group, fallbacks) {
  const meta = getGroupMarkerMeta(group, fallbacks);
  return L.divIcon({
    className: "psm-leaflet-pin",
    html: buildCircleMarkerHtml(meta),
    iconSize: [52, 62],
    iconAnchor: [26, 62],
    popupAnchor: [0, -58],
  });
}

function FitBounds({ groups }) {
  const map = useMap();

  useEffect(() => {
    if (groups.length > 1) {
      const bounds = L.latLngBounds(groups.map((g) => [g.lat, g.lng]));
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15 });
    } else if (groups.length === 1) {
      map.setView([groups[0].lat, groups[0].lng], 14);
    } else {
      map.setView([TAIWAN_CENTER.lat, TAIWAN_CENTER.lng], 7);
    }
  }, [groups, map]);

  return null;
}

function InvalidateSize() {
  const map = useMap();

  useEffect(() => {
    const run = () => map.invalidateSize();
    const t1 = setTimeout(run, 50);
    const t2 = setTimeout(run, 300);
    window.addEventListener("resize", run);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("resize", run);
    };
  }, [map]);

  return null;
}

export default function PlaySessionsOsmMap({
  sessions = [],
  courts = [],
  providerLabel,
  tab = "upcoming",
  onSwitchTab,
  fullscreen = false,
}) {
  const { t } = useTranslation("play");
  const { groups, mappedCount } = useSessionMapGroups(sessions, courts);
  const markerFallbacks = {
    fallbackLabel: t("map_marker.fallback_label"),
    fallbackInitial: t("map_marker.fallback_initial"),
  };

  return (
    <MapShell
      fullscreen={fullscreen}
      toolbar={
        <MapToolbar
          groups={groups}
          mappedCount={mappedCount}
          sessionsCount={sessions.length}
          providerLabel={providerLabel ?? t("map.providers.osm")}
        />
      }
      empty={
        groups.length === 0 ? (
          <div className="psm-empty">
            <Users size={20} className="text-gray-400 mb-2" />
            <p className="text-sm text-gray-500">{t("map.no_markers")}</p>
          </div>
        ) : null
      }
      footer={
        groups.length === 0 ? (
          <MapEmptyHint
            tab={tab}
            sessionsCount={sessions.length}
            mappedCount={mappedCount}
            onSwitchTab={onSwitchTab}
          />
        ) : null
      }
    >
      <MapContainer
        center={[TAIWAN_CENTER.lat, TAIWAN_CENTER.lng]}
        zoom={7}
        scrollWheelZoom
        style={{ width: "100%", height: "100%" }}
      >
        <TileLayer attribution={OSM_ATTRIBUTION} url={OSM_TILE} />
        <InvalidateSize />
        <FitBounds groups={groups} />
        {groups.map((group) => (
          <Marker
            key={group.id}
            position={[group.lat, group.lng]}
            icon={createCircleMarkerIcon(group, markerFallbacks)}
          >
            <Popup maxWidth={320} minWidth={240}>
              <MapInfoContent group={group} />
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </MapShell>
  );
}
