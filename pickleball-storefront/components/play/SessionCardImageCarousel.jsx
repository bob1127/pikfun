"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";

const PLACEHOLDER =
  "linear-gradient(135deg, #e8edf3 0%, #d4dce6 50%, #c5d0dc 100%)";
const SLIDE_MS = 2800;

function buildPhotosUrl(session) {
  const params = new URLSearchParams();
  if (session.court_id) params.set("court_id", session.court_id);
  if (session.location_name) params.set("name", session.location_name);
  if (session.location_address) params.set("address", session.location_address);
  if (session.latitude != null) params.set("lat", String(session.latitude));
  if (session.longitude != null) params.set("lng", String(session.longitude));
  return `/api/places/photos?${params}`;
}

export default function SessionCardImageCarousel({ session, isHovered = false }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setPhotos([]);
    setActive(0);

    (async () => {
      try {
        const res = await fetch(buildPhotosUrl(session));
        const data = res.ok ? await res.json() : { photos: [] };
        if (!cancelled) setPhotos(Array.isArray(data.photos) ? data.photos : []);
      } catch {
        if (!cancelled) setPhotos([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    session.id,
    session.court_id,
    session.location_name,
    session.location_address,
    session.latitude,
    session.longitude,
  ]);

  useEffect(() => {
    if (!isHovered || photos.length <= 1) return undefined;
    const timer = setInterval(() => {
      setActive((i) => (i + 1) % photos.length);
    }, SLIDE_MS);
    return () => clearInterval(timer);
  }, [isHovered, photos.length]);

  useEffect(() => {
    if (!isHovered) setActive(0);
  }, [isHovered]);

  if (loading) {
    return (
      <div
        className="absolute inset-0 animate-pulse"
        style={{ background: PLACEHOLDER }}
      />
    );
  }

  if (!photos.length) {
    return (
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-400"
        style={{ background: PLACEHOLDER }}
      >
        <MapPin size={28} strokeWidth={1.5} />
        <span className="text-xs font-medium px-4 text-center line-clamp-2">
          {session.location_name || "地點圖片"}
        </span>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      <motion.div
        className="flex h-full"
        animate={{ x: `-${active * 100}%` }}
        transition={{ duration: 0.48, ease: [0.4, 0, 0.2, 1] }}
      >
        {photos.map((src) => (
          <div key={src} className="h-full min-w-full shrink-0">
            <img
              src={src}
              alt={session.location_name || session.title || "球場照片"}
              className="w-full h-full object-cover"
              loading="lazy"
              draggable={false}
            />
          </div>
        ))}
      </motion.div>

      {photos.length > 1 && isHovered && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 z-10">
          {photos.map((src, i) => (
            <span
              key={src}
              className={`block h-[3px] rounded-full transition-all duration-300 ${
                i === active ? "w-4 bg-white" : "w-1.5 bg-white/50"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
