import { useState, useCallback } from "react";
import { useTranslation } from "next-i18next";
import { commaToArray, linesToArray } from "@/lib/coachProfileFields";

export function useCoachSectionEdit({ slug, userInfo, onCoachUpdate }) {
  const { t } = useTranslation("coaching");
  const [activeSection, setActiveSection] = useState(null);
  const [draft, setDraft] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const startEdit = useCallback((sectionId, initialDraft) => {
    setActiveSection(sectionId);
    setDraft(initialDraft);
    setError("");
  }, []);

  const cancelEdit = useCallback(() => {
    setActiveSection(null);
    setDraft({});
    setError("");
  }, []);

  const patchCoach = useCallback(
    async (payload) => {
      if (!userInfo?.email) throw new Error(t("errors.login_required"));
      setSaving(true);
      setError("");
      try {
        const res = await fetch(`/api/featured-coaches/${slug}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: userInfo.email,
            member_id: userInfo.id,
            ...payload,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || t("errors.save_failed"));
        onCoachUpdate?.(data.coach);
        cancelEdit();
        return data.coach;
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [slug, userInfo, onCoachUpdate, cancelEdit, t]
  );

  const isEditing = useCallback(
    (sectionId) => activeSection === sectionId,
    [activeSection]
  );

  return {
    activeSection,
    draft,
    setDraft,
    saving,
    error,
    startEdit,
    cancelEdit,
    patchCoach,
    isEditing,
  };
}

export function buildBioHtml(coach) {
  if (coach.bio_html) return coach.bio_html;
  if (coach.bio) return `<p>${coach.bio}</p>`;
  return "";
}

export function buildStoryHtml(coach) {
  if (coach.story_html) return coach.story_html;
  if (coach.story) {
    return coach.story
      .split("\n\n")
      .filter(Boolean)
      .map((p) => `<p>${p}</p>`)
      .join("");
  }
  return "";
}

export function preparePatchFields(sectionId, draft) {
  switch (sectionId) {
    case "hero":
      return {
        video_url: draft.video_url || "",
        cover_image: draft.cover_image || "",
      };
    case "header":
      return {
        name: draft.name,
        title: draft.title,
        excerpt: draft.excerpt,
        featured_label: draft.featured_label,
        avatar: draft.avatar,
      };
    case "bio":
      return { bio_html: draft.bio_html, bio: "" };
    case "story":
      return { story_html: draft.story_html, story: "" };
    case "credentials":
      return {
        credentials: linesToArray(draft.credentials),
      };
    case "specialties":
      return {
        specialties: commaToArray(draft.specialties),
      };
    case "tags":
      return {
        tags: commaToArray(draft.tags),
      };
    case "instagram":
      return {
        instagram: draft.instagram,
        instagram_embed_urls: draft.instagram_embed_urls,
      };
    case "contact":
      return {
        city: draft.city,
        region: draft.region,
        contact_email: draft.contact_email,
        instagram: draft.instagram,
      };
    default:
      return draft;
  }
}
