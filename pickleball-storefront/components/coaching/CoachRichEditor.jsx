"use client";

import { useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { useTranslation } from "next-i18next";
import { COACH_MEDIA_LIMITS, formatBytes } from "@/lib/coachMediaLimits";

const Editor = dynamic(
  () => import("@tinymce/tinymce-react").then((m) => m.Editor),
  { ssr: false, loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-lg" /> }
);

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function CoachRichEditor({
  value,
  onChange,
  label,
  slug,
  email,
  memberId,
  usage,
  onUsageChange,
  minHeight = 320,
  placeholder,
}) {
  const { t } = useTranslation("coaching");
  const resolvedPlaceholder = placeholder || t("editor.placeholder");
  const editorRef = useRef(null);

  const mediaLabel = useCallback(
    (mediaType) => t(`editor.media_labels.${mediaType}`),
    [t]
  );

  const uploadMedia = useCallback(
    async (file, mediaType) => {
      const limits = COACH_MEDIA_LIMITS[mediaType];
      const label = mediaLabel(mediaType);
      if (!limits.allowedTypes.includes(file.type)) {
        throw new Error(t("editor.errors.format_unsupported", { label }));
      }
      if (file.size > limits.maxFileBytes) {
        throw new Error(
          t("editor.errors.size_exceeded", {
            label,
            size: formatBytes(limits.maxFileBytes),
          })
        );
      }

      const currentCount = usage?.[mediaType]?.count ?? 0;
      if (currentCount >= limits.maxCount) {
        throw new Error(
          t("editor.errors.quota_exceeded", { label, max: limits.maxCount })
        );
      }

      const fileBase64 = await fileToBase64(file);
      const res = await fetch("/api/coach-media/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          email,
          member_id: memberId,
          fileBase64,
          fileName: file.name,
          contentType: file.type,
          mediaType,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t("editor.errors.upload_failed"));
      if (data.usage && onUsageChange) onUsageChange(data.usage);
      return data.url;
    },
    [slug, email, memberId, usage, onUsageChange, mediaLabel, t]
  );

  const handleImageUpload = useCallback(
    (blobInfo) =>
      uploadMedia(
        blobInfo.blob(),
        "image"
      ).catch((err) => {
        throw err;
      }),
    [uploadMedia]
  );

  return (
    <div>
      {label && (
        <label className="block text-xs font-bold text-gray-500 mb-1.5">
          {label}
        </label>
      )}
      <div className="rounded-lg overflow-hidden border border-gray-200 bg-white">
        <Editor
          tinymceScriptSrc="https://cdn.jsdelivr.net/npm/tinymce@7.6.0/tinymce.min.js"
          onInit={(_evt, editor) => {
            editorRef.current = editor;
          }}
          value={value}
          onEditorChange={onChange}
          init={{
            license_key: "gpl",
            height: minHeight,
            menubar: true,
            plugins: [
              "advlist",
              "autolink",
              "lists",
              "link",
              "image",
              "media",
              "table",
              "code",
              "fullscreen",
              "preview",
              "searchreplace",
              "wordcount",
              "insertdatetime",
              "help",
              "charmap",
              "anchor",
            ],
            toolbar:
              "undo redo | blocks fontsize | bold italic underline strikethrough | " +
              "alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | " +
              "link image media uploadvideo | table | code fullscreen preview",
            content_style:
              "body { font-family: system-ui, sans-serif; font-size: 15px; line-height: 1.7; }",
            placeholder: resolvedPlaceholder,
            branding: false,
            promotion: false,
            relative_urls: false,
            convert_urls: false,
            automatic_uploads: true,
            images_upload_handler: async (blobInfo, progress) => {
              try {
                progress(0);
                const url = await handleImageUpload(blobInfo);
                progress(100);
                return url;
              } catch (err) {
                throw err.message || t("editor.errors.image_upload_failed");
              }
            },
            file_picker_types: "image media",
            file_picker_callback: (callback, _value, meta) => {
              const input = document.createElement("input");
              input.setAttribute("type", "file");
              if (meta.filetype === "image") {
                input.setAttribute("accept", COACH_MEDIA_LIMITS.image.allowedTypes.join(","));
              } else {
                input.setAttribute("accept", COACH_MEDIA_LIMITS.video.allowedTypes.join(","));
              }
              input.onchange = async () => {
                const file = input.files?.[0];
                if (!file) return;
                try {
                  const mediaType = file.type.startsWith("video/") ? "video" : "image";
                  const url = await uploadMedia(file, mediaType);
                  if (mediaType === "video") {
                    callback(url, { title: file.name });
                  } else {
                    callback(url, { alt: file.name });
                  }
                } catch (err) {
                  alert(err.message);
                }
              };
              input.click();
            },
            setup: (editor) => {
              editor.ui.registry.addButton("uploadvideo", {
                text: t("editor.upload_video_btn"),
                onAction: () => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = COACH_MEDIA_LIMITS.video.allowedTypes.join(",");
                  input.onchange = async () => {
                    const file = input.files?.[0];
                    if (!file) return;
                    try {
                      const url = await uploadMedia(file, "video");
                      editor.insertContent(
                        `<video controls playsinline style="max-width:100%;border-radius:8px"><source src="${url}" type="${file.type}"></video>`
                      );
                    } catch (err) {
                      alert(err.message);
                    }
                  };
                  input.click();
                },
              });
            },
          }}
        />
      </div>
    </div>
  );
}
