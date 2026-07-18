"use client";

import Link from "next/link";
import { MapPin, CalendarDays } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "next-i18next";
import {
  enrichSessionsWithCoords,
  groupSessionsByLocation,
} from "@/lib/sessionGeocode";
import { getGroupMarkerMeta } from "@/components/play/map/markerUtils";
import {
  formatSessionDate,
  formatSessionRange,
  formatFee,
  getSkillLevelLabel,
} from "@/lib/playUtils";

export const TAIWAN_CENTER = { lat: 23.6978, lng: 120.9605 };

export function useSessionMapGroups(sessions, courts) {
  const groups = useMemo(() => {
    const enriched = enrichSessionsWithCoords(sessions, courts);
    return groupSessionsByLocation(enriched);
  }, [sessions, courts]);

  const mappedCount = useMemo(
    () =>
      enrichSessionsWithCoords(sessions, courts).filter((s) => s.lat != null)
        .length,
    [sessions, courts]
  );

  return { groups, mappedCount };
}

export function MapInfoContent({ group }) {
  const { t } = useTranslation("play");
  const sessions = [...group.sessions].sort(
    (a, b) => new Date(a.starts_at) - new Date(b.starts_at)
  );
  const meta = getGroupMarkerMeta(group, {
    fallbackLabel: t("map_marker.fallback_label"),
    fallbackInitial: t("map_marker.fallback_initial"),
  });

  return (
    <div className="psm-info min-w-[220px] max-w-[280px]">
      <div className="flex items-start gap-3 mb-3 pb-3 border-b border-gray-100">
        <div
          className="psm-info-avatar"
          style={{ borderColor: meta.multi ? "#ef4023" : "#005caf" }}
        >
          {meta.avatar ? (
            <img src={meta.avatar} alt="" referrerPolicy="no-referrer" />
          ) : (
            <span>{meta.initial}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold tracking-widest uppercase text-[#005caf] mb-0.5">
            {group.location_name}
          </p>
          {group.location_address && (
            <p className="text-[11px] text-gray-500 leading-snug">
              {group.location_address}
            </p>
          )}
        </div>
      </div>
      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
        {sessions.map((s) => (
          <Link
            key={s.id}
            href={`/play/${s.id}`}
            className="block p-2.5 rounded-lg border border-gray-100 hover:border-[#005caf]/40 hover:bg-[#005caf]/5 transition-colors"
          >
            <p className="font-bold text-sm text-gray-900 line-clamp-1">
              {s.title}
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1">
              <CalendarDays size={11} />
              {formatSessionDate(s.starts_at)} ·{" "}
              {formatSessionRange(s.starts_at, s.ends_at)}
            </p>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                {s.skill_level ? getSkillLevelLabel(s.skill_level, t) : t("common.unlimited")}
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#005caf]/10 text-[#005caf]">
                {s.joined_count ?? 0}/{s.max_players} {t("map.info.people_unit")}
              </span>
              <span className="text-[10px] font-bold text-gray-500">
                {formatFee(s.fee_per_person, s.payment_method, t)}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function MapToolbar({
  groups,
  mappedCount,
  sessionsCount,
  providerLabel,
}) {
  const { t } = useTranslation("play");
  return (
    <div className="psm-toolbar">
      <div className="flex items-center gap-2 text-sm text-gray-600 flex-wrap">
        <MapPin size={15} className="text-[#005caf]" />
        <span>
          <strong className="text-gray-900">{groups.length}</strong>{" "}
          {t("map.toolbar.locations")} ·{" "}
          <strong className="text-gray-900">{mappedCount}</strong>{" "}
          {t("map.toolbar.sessions_mapped")}
        </span>
        {providerLabel && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
            {providerLabel}
          </span>
        )}
      </div>
      {mappedCount < sessionsCount && (
        <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
          {t("map.toolbar.unmapped", { count: sessionsCount - mappedCount })}
        </span>
      )}
    </div>
  );
}

export function MapEmptyHint({ tab, sessionsCount, mappedCount, onSwitchTab }) {
  const { t } = useTranslation("play");

  if (sessionsCount > 0 && mappedCount === 0) {
    return (
      <div className="px-4 py-3 bg-amber-50 border-t border-amber-100 text-xs text-amber-800 leading-relaxed">
        {t("map.empty_hint.unmapped_note", { count: sessionsCount })}
      </div>
    );
  }

  if (sessionsCount === 0 && tab === "upcoming") {
    return (
      <div className="px-4 py-3 bg-blue-50 border-t border-blue-100 text-xs text-blue-900 leading-relaxed">
        {t("map.empty_hint.no_upcoming")}
        {onSwitchTab && (
          <>
            {" "}
            <button
              type="button"
              onClick={() => onSwitchTab("ended")}
              className="font-bold underline hover:text-[#005caf]"
            >
              {t("map.empty_hint.switch_to_ended")}
            </button>
            {t("map.empty_hint.no_upcoming_suffix")}
          </>
        )}
      </div>
    );
  }

  if (sessionsCount === 0) {
    return (
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-600 leading-relaxed">
        {t("map.empty_hint.no_sessions")}
      </div>
    );
  }

  return null;
}

export function MapShell({ toolbar, children, empty, footer, fullscreen = false }) {
  return (
    <div className={`psm-wrap${fullscreen ? " psm-wrap--fullscreen" : ""}`}>
      {toolbar}
      <div className="psm-map">{children}</div>
      {empty}
      {footer}
      <style jsx>{`
        .psm-wrap {
          position: relative;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 1rem;
          overflow: hidden;
        }
        .psm-wrap--fullscreen {
          height: 100%;
          display: flex;
          flex-direction: column;
          border: none;
          border-radius: 0;
        }
        .psm-wrap--fullscreen .psm-map {
          flex: 1;
          height: auto;
          min-height: 0;
        }
        .psm-toolbar {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          padding: 0.875rem 1rem;
          border-bottom: 1px solid #f1f5f9;
          background: #fafbfc;
        }
        .psm-map {
          height: min(62vh, 520px);
          min-height: 360px;
        }
        .psm-empty {
          position: absolute;
          inset: auto 0 0 0;
          pointer-events: none;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 1.5rem;
          background: transparent;
        }
        :global(.psm-leaflet-pin) {
          background: transparent !important;
          border: none !important;
        }
        :global(.leaflet-container) {
          font-family: inherit;
          z-index: 0;
        }
        :global(.psm-circle-wrap) {
          position: relative;
          width: 52px;
          height: 62px;
          background: transparent;
          border: none;
          padding: 0;
          cursor: pointer;
          transform: translate(-50%, -100%);
        }
        :global(.psm-circle-wrap.is-active) {
          transform: translate(-50%, -100%) scale(1.06);
        }
        :global(.psm-circle) {
          position: relative;
          display: block;
          width: 48px;
          height: 48px;
          border-radius: 9999px;
          border: 3px solid #005caf;
          overflow: hidden;
          background: linear-gradient(135deg, #005caf, #1a3a8a);
        }
        :global(.psm-circle-img) {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        :global(.psm-circle-fallback) {
          width: 100%;
          height: 100%;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 18px;
          font-weight: 800;
        }
        :global(.psm-circle-badge) {
          position: absolute;
          top: -2px;
          right: -2px;
          min-width: 18px;
          height: 18px;
          padding: 0 4px;
          border-radius: 9999px;
          border: 2px solid #fff;
          color: #fff;
          font-size: 10px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
        }
        :global(.psm-circle-pointer) {
          position: absolute;
          left: 50%;
          bottom: 2px;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 7px solid transparent;
          border-right: 7px solid transparent;
          border-top: 9px solid #005caf;
        }
        :global(.psm-info-avatar) {
          width: 44px;
          height: 44px;
          border-radius: 9999px;
          border: 3px solid #005caf;
          overflow: hidden;
          background: linear-gradient(135deg, #005caf, #1a3a8a);
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-weight: 800;
        }
        :global(.psm-info-avatar img) {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      `}</style>
    </div>
  );
}
