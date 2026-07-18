"use client";

import { useTranslation } from "next-i18next";
import { getGroupMarkerMeta } from "@/components/play/map/markerUtils";

export default function CircleMapMarker({
  group,
  active = false,
  onClick,
  className = "",
}) {
  const { t } = useTranslation("play");
  const meta = getGroupMarkerMeta(group, {
    fallbackLabel: t("map_marker.fallback_label"),
    fallbackInitial: t("map_marker.fallback_initial"),
  });
  const border = meta.multi ? "#ef4023" : "#005caf";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`psm-circle-wrap ${active ? "is-active" : ""} ${className}`}
      aria-label={t("aria.map_marker", { label: meta.label, count: meta.count })}
    >
      <span
        className="psm-circle"
        style={{
          borderColor: border,
          boxShadow: `0 0 0 3px ${active ? "#c8f542" : "#ffffff"}, 0 8px 20px rgba(15,23,42,0.22)`,
        }}
      >
        {meta.avatar ? (
          <img
            src={meta.avatar}
            alt=""
            className="psm-circle-img"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              const fb = e.currentTarget.parentElement?.querySelector(
                ".psm-circle-fallback"
              );
              if (fb) fb.style.display = "flex";
            }}
          />
        ) : null}
        <span
          className="psm-circle-fallback"
          style={{ display: meta.avatar ? "none" : "flex" }}
        >
          {meta.initial}
        </span>
      </span>
      {meta.multi ? (
        <span className="psm-circle-badge" style={{ background: border }}>
          {meta.count}
        </span>
      ) : null}
      <span className="psm-circle-pointer" style={{ borderTopColor: border }} />
    </button>
  );
}
