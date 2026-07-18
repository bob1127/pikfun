"use client";

import { Calendar, Clock, MapPin, Users } from "lucide-react";
import { useTranslation } from "next-i18next";
import {
  formatSessionDate,
  formatSessionRange,
  getSkillLevelLabel,
  formatFee,
} from "@/lib/playUtils";
import { StatusPanel } from "@/components/notifications/StatusNotificationLayout";

function InfoRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3">
      <Icon size={15} className="mt-0.5 shrink-0 text-[#3D8FD9]" />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">
          {label}
        </p>
        <div className="mt-0.5 text-sm leading-relaxed text-white/85">{children}</div>
      </div>
    </div>
  );
}

export default function JoinedSessionSummary({ session }) {
  const { t, i18n } = useTranslation("play");
  const locale = i18n.language || "zh-TW";

  if (!session) return null;

  const dateText = formatSessionDate(session.starts_at, locale);
  const timeText = formatSessionRange(session.starts_at, session.ends_at, locale);
  const location = session.location_name || session.location_address || "—";
  const address =
    session.location_address &&
    session.location_address !== session.location_name
      ? session.location_address
      : null;

  return (
    <StatusPanel>
      <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.35em] text-white/50">
        {t("summary.title")}
      </p>
      <h3 className="text-base font-bold leading-snug tracking-wide">
        {session.title}
      </h3>

      <div className="mt-5 space-y-4 border-t border-white/10 pt-5">
        <InfoRow icon={Calendar} label={t("summary.date")}>
          {dateText || "—"}
        </InfoRow>
        <InfoRow icon={Clock} label={t("summary.time")}>
          {timeText || "—"}
        </InfoRow>
        <InfoRow icon={MapPin} label={t("summary.location")}>
          <span className="font-semibold">{location}</span>
          {address && (
            <span className="mt-1 block text-xs text-white/55">{address}</span>
          )}
        </InfoRow>
        {(session.max_players || session.skill_level) && (
          <InfoRow icon={Users} label={t("summary.session")}>
            <span className="inline-flex flex-wrap items-center gap-2">
              {session.max_players && (
                <span>{t("summary.max_players", { count: session.max_players })}</span>
              )}
              {session.skill_level && (
                <span className="border border-white/20 px-2 py-0.5 text-[11px] font-bold text-[#7ec8ff]">
                  {getSkillLevelLabel(session.skill_level, t)}
                </span>
              )}
              {session.fee_per_person != null && (
                <span className="text-white/65">
                  · {formatFee(session.fee_per_person, session.payment_method, t)}
                </span>
              )}
            </span>
          </InfoRow>
        )}
      </div>
    </StatusPanel>
  );
}
