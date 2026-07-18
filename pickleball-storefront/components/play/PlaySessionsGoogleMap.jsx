"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  OverlayView,
  InfoWindowF,
} from "@react-google-maps/api";
import { useTranslation } from "next-i18next";
import { Loader2, Users } from "lucide-react";
import {
  MapInfoContent,
  MapEmptyHint,
  MapShell,
  MapToolbar,
  TAIWAN_CENTER,
  useSessionMapGroups,
} from "@/components/play/map/SessionMapShared";
import CircleMapMarker from "@/components/play/map/CircleMapMarker";

const MAP_STYLE = { width: "100%", height: "100%" };
const MAP_OPTIONS = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  gestureHandling: "greedy",
  minZoom: 6,
  maxZoom: 18,
};

const overlayOffset = () => ({ x: -26, y: -62 });

export default function PlaySessionsGoogleMap({
  sessions = [],
  courts = [],
  apiKey,
  tab = "upcoming",
  onSwitchTab,
  onFallback,
  fullscreen = false,
}) {
  const { t, i18n } = useTranslation("play");
  const locale = i18n.language || "zh-TW";
  const [activeId, setActiveId] = useState(null);
  const { groups, mappedCount } = useSessionMapGroups(sessions, courts);

  const { isLoaded, loadError } = useJsApiLoader({
    id: "PikFun-play-map",
    googleMapsApiKey: apiKey,
    language: locale,
    region: "TW",
  });

  useEffect(() => {
    if (loadError) onFallback?.("load_error");
  }, [loadError, onFallback]);

  const bounds = useMemo(() => {
    if (!groups.length || typeof window === "undefined" || !window.google?.maps)
      return null;
    const b = new window.google.maps.LatLngBounds();
    groups.forEach((g) => b.extend({ lat: g.lat, lng: g.lng }));
    return b;
  }, [groups, isLoaded]);

  const onLoad = useCallback(
    (map) => {
      if (bounds && groups.length > 1) {
        map.fitBounds(bounds, { top: 48, right: 48, bottom: 48, left: 48 });
      } else if (groups.length === 1) {
        map.setCenter({ lat: groups[0].lat, lng: groups[0].lng });
        map.setZoom(14);
      } else {
        map.setCenter(TAIWAN_CENTER);
        map.setZoom(7);
      }
    },
    [bounds, groups],
  );

  if (loadError) {
    return null;
  }

  if (!isLoaded) {
    return (
      <div
        className={`psm-fallback${fullscreen ? " psm-fallback--fullscreen" : ""}`}
      >
        <Loader2 size={28} className="animate-spin text-[#005caf] mb-3" />
        <p className="text-sm text-gray-500">{t("map.loading_google")}</p>
        <style jsx>{`
          .psm-fallback {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            min-height: 360px;
            padding: 2rem;
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 1rem;
          }
          .psm-fallback--fullscreen {
            height: 100%;
            min-height: 0;
            border: none;
            border-radius: 0;
          }
        `}</style>
      </div>
    );
  }

  const activeGroup = groups.find((g) => g.id === activeId);

  return (
    <MapShell
      fullscreen={fullscreen}
      toolbar={
        <MapToolbar
          groups={groups}
          mappedCount={mappedCount}
          sessionsCount={sessions.length}
          providerLabel={t("map.providers.google")}
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
      <GoogleMap
        mapContainerStyle={MAP_STYLE}
        center={TAIWAN_CENTER}
        zoom={7}
        options={MAP_OPTIONS}
        onLoad={onLoad}
        onClick={() => setActiveId(null)}
      >
        {groups.map((group) => (
          <OverlayView
            key={group.id}
            position={{ lat: group.lat, lng: group.lng }}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
            getPixelPositionOffset={overlayOffset}
          >
            <CircleMapMarker
              group={group}
              active={activeId === group.id}
              onClick={(e) => {
                e.stopPropagation();
                setActiveId(group.id);
              }}
            />
          </OverlayView>
        ))}

        {activeGroup && (
          <InfoWindowF
            position={{ lat: activeGroup.lat, lng: activeGroup.lng }}
            onCloseClick={() => setActiveId(null)}
          >
            <MapInfoContent group={activeGroup} />
          </InfoWindowF>
        )}
      </GoogleMap>
    </MapShell>
  );
}
