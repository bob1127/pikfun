"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useTranslation } from "next-i18next";

const PlaySessionsOsmMap = dynamic(
  () => import("@/components/play/PlaySessionsOsmMap"),
  {
    ssr: false,
    // module-scope loading placeholder has no access to i18n context
    loading: () => (
      <div className="min-h-[360px] flex items-center justify-center text-gray-400 text-sm bg-white border border-gray-200 rounded-2xl">
        載入地圖中…
      </div>
    ),
  }
);

const PlaySessionsGoogleMap = dynamic(
  () => import("@/components/play/PlaySessionsGoogleMap"),
  { ssr: false }
);

export default function PlaySessionsMap({
  sessions = [],
  courts = [],
  tab = "upcoming",
  onSwitchTab,
  fullscreen = false,
}) {
  const { t } = useTranslation("play");
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
  const [forceOsm, setForceOsm] = useState(false);

  if (!apiKey || forceOsm) {
    return (
      <PlaySessionsOsmMap
        sessions={sessions}
        courts={courts}
        tab={tab}
        onSwitchTab={onSwitchTab}
        fullscreen={fullscreen}
        providerLabel={
          apiKey && forceOsm
            ? t("map.providers.osm_fallback")
            : t("map.providers.osm")
        }
      />
    );
  }

  return (
    <PlaySessionsGoogleMap
      sessions={sessions}
      courts={courts}
      tab={tab}
      onSwitchTab={onSwitchTab}
      fullscreen={fullscreen}
      apiKey={apiKey}
      onFallback={() => setForceOsm(true)}
    />
  );
}
