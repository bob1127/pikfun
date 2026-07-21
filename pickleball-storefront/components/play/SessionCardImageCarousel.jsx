"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "next-i18next";
import { MapPin } from "lucide-react";

const PLACEHOLDER =
  "linear-gradient(135deg, #e8edf3 0%, #d4dce6 50%, #c5d0dc 100%)";

export default function SessionCardImageCarousel({
  session,
  onStateChange,
}) {
  const { t } = useTranslation("play");
  const [photo, setPhoto] = useState("");

  useEffect(() => {
    let cancelled = false;
    setPhoto("");
    if (!session.court_id) return undefined;

    fetch(
      `/api/places/photos?court_id=${encodeURIComponent(session.court_id)}&max=1`,
    )
      .then((res) => (res.ok ? res.json() : { photos: [] }))
      .then((data) => {
        if (!cancelled) setPhoto(data.photos?.[0] || "");
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [session.court_id]);

  useEffect(() => {
    onStateChange?.({ active: 0, count: photo ? 1 : 0 });
  }, [onStateChange, photo]);

  if (photo) {
    return (
      <img
        src={photo}
        alt={session.location_name || session.title}
        className="absolute inset-0 h-full w-full object-cover"
        loading="lazy"
        draggable={false}
      />
    );
  }

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-400"
      style={{ background: PLACEHOLDER }}
    >
      <MapPin size={28} strokeWidth={1.5} />
      <span className="line-clamp-2 px-4 text-center text-xs font-medium">
        {session.location_name || t("card.location_image_fallback")}
      </span>
    </div>
  );
}
