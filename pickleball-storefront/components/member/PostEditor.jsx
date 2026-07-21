"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TiptapImage from "@tiptap/extension-image";
import TiptapLink from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import TextAlign from "@tiptap/extension-text-align";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import Youtube from "@tiptap/extension-youtube";
import PhotoGallery from "@/components/member/PhotoGalleryExtension";
import {
  StyledText,
  Video,
} from "@/components/member/RichTextExtensions";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  LinkIcon,
  ImageIcon,
  Images as ImagesIcon,
  Table as TableIcon,
  Eraser,
  Code2,
  Quote,
  Minus,
  Undo2,
  Redo2,
  ChevronDown,
  Loader2,
  Palette,
  Highlighter,
  Video as VideoIcon,
  Upload,
} from "lucide-react";

const CONTENT_LIMIT = 12000;

const PARAGRAPH_STYLES = [
  { value: "p", label: "一般文字" },
  { value: "h1", label: "標題 1" },
  { value: "h2", label: "標題 2" },
  { value: "h3", label: "標題 3" },
  { value: "h4", label: "標題 4" },
  { value: "h5", label: "標題 5" },
  { value: "h6", label: "標題 6" },
];

function ToolbarButton({ active, onClick, disabled, title, children }) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-8 min-w-8 items-center justify-center rounded-md px-1.5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
        active
          ? "bg-gray-900 text-white"
          : "text-gray-600 hover:bg-gray-200/70"
      }`}
    >
      {children}
    </button>
  );
}

function ParagraphStyleSelect({ editor }) {
  const activeLevel = [1, 2, 3, 4, 5, 6].find((level) =>
    editor.isActive("heading", { level }),
  );
  const current = activeLevel ? `h${activeLevel}` : "p";

  const handleChange = (e) => {
    const value = e.target.value;
    if (value === "p") {
      editor.chain().focus().setParagraph().run();
    } else {
      const level = Number(value.replace("h", ""));
      editor.chain().focus().toggleHeading({ level }).run();
    }
  };

  return (
    <div className="relative">
      <select
        value={current}
        onChange={handleChange}
        className="h-8 appearance-none rounded-md border border-transparent bg-transparent pl-2 pr-6 text-xs font-bold text-gray-700 hover:bg-gray-200/70 focus:outline-none cursor-pointer"
      >
        {PARAGRAPH_STYLES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={12}
        className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400"
      />
    </div>
  );
}

export default function PostEditor({
  content,
  onChange,
  uploadImage,
  uploadVideo,
  placeholderText,
}) {
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [galleryProgress, setGalleryProgress] = useState("");
  const [showHtmlSource, setShowHtmlSource] = useState(false);
  const [htmlDraft, setHtmlDraft] = useState("");
  const [showVideoPanel, setShowVideoPanel] = useState(false);
  const [videoMode, setVideoMode] = useState("local");
  const [videoUrl, setVideoUrl] = useState("");
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const fileInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const extensions = useMemo(
    () => [
      StarterKit.configure({ heading: { levels: [1, 2, 3, 4, 5, 6] } }),
      Underline,
      StyledText,
      TiptapImage.configure({ HTMLAttributes: { class: "pe-img" } }),
      TiptapLink.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { class: "pe-link" },
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Youtube.configure({ nocookie: true, width: 640, height: 360 }),
      Video,
      PhotoGallery,
      Placeholder.configure({
        placeholder:
          placeholderText ||
          "分享課程亮點、活動細節，或給球友的小提醒…",
      }),
      CharacterCount.configure({ limit: CONTENT_LIMIT }),
    ],
    [placeholderText],
  );

  const editor = useEditor({
    extensions,
    content: content || "",
    onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
    editorProps: {
      attributes: {
        class:
          "pe-prose prose prose-sm sm:prose-base max-w-none focus:outline-none min-h-[320px] px-5 py-4",
      },
    },
    immediatelyRender: false,
  });

  const setLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href;
    const url = window.prompt("輸入連結網址", prev || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const insertTable = useCallback(() => {
    editor
      ?.chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  }, [editor]);

  const insertVideoUrl = useCallback(() => {
    const url = videoUrl.trim();
    if (!url || !editor) return;
    let validUrl;
    try {
      validUrl = new URL(url);
    } catch {
      alert("請輸入有效的影片網址");
      return;
    }
    if (!["http:", "https:"].includes(validUrl.protocol)) {
      alert("影片網址僅支援 http 或 https");
      return;
    }

    const inserted =
      videoMode === "youtube"
        ? editor.commands.setYoutubeVideo({ src: validUrl.toString() })
        : editor.commands.setVideo({ src: validUrl.toString() });
    if (inserted === false) {
      alert(
        videoMode === "youtube"
          ? "請輸入有效的 YouTube 網址"
          : "無法插入此影片網址",
      );
      return;
    }
    setVideoUrl("");
    setShowVideoPanel(false);
    editor.commands.focus();
  }, [editor, videoMode, videoUrl]);

  const handleLocalVideo = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !editor || !uploadVideo) return;
    setUploadingVideo(true);
    try {
      const url = await uploadVideo(file);
      if (url) {
        editor.chain().focus().setVideo({ src: url }).run();
        setShowVideoPanel(false);
      }
    } catch (err) {
      alert(err.message || "影片上傳失敗");
    } finally {
      setUploadingVideo(false);
    }
  };

  const handlePickImage = () => fileInputRef.current?.click();

  const handleImageFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !editor) return;

    setUploadingImage(true);
    try {
      let url;
      if (uploadImage) {
        url = await uploadImage(file);
      } else {
        url = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }
      if (url) {
        editor.chain().focus().setImage({ src: url }).run();
      }
    } catch (err) {
      alert(err.message || "圖片上傳失敗");
    } finally {
      setUploadingImage(false);
    }
  };

  const handlePickGallery = () => galleryInputRef.current?.click();

  const handleGalleryFiles = async (e) => {
    const files = Array.from(e.target.files || []).slice(0, 9);
    e.target.value = "";
    if (!files.length || !editor) return;

    setUploadingGallery(true);
    try {
      const urls = [];
      for (let i = 0; i < files.length; i++) {
        setGalleryProgress(`${i + 1}/${files.length}`);
        let url;
        if (uploadImage) {
          url = await uploadImage(files[i]);
        } else {
          url = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(files[i]);
          });
        }
        if (url) urls.push(url);
      }
      if (urls.length) {
        editor.chain().focus().insertPhotoGallery(urls).run();
      }
    } catch (err) {
      alert(err.message || "圖片上傳失敗");
    } finally {
      setUploadingGallery(false);
      setGalleryProgress("");
    }
  };

  const toggleHtmlSource = () => {
    if (!editor) return;
    if (!showHtmlSource) {
      setHtmlDraft(editor.getHTML());
      setShowHtmlSource(true);
    } else {
      editor.commands.setContent(htmlDraft, true);
      onChange?.(editor.getHTML());
      setShowHtmlSource(false);
    }
  };

  if (!editor) return null;

  const chars = editor.storage.characterCount.characters();

  return (
    <div className="pe-wrap border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm">
      {/* Row 1 */}
      <div className="flex items-center gap-0.5 flex-wrap px-2 py-1.5 border-b border-gray-100 bg-white">
        <ParagraphStyleSelect editor={editor} />

        <span className="w-px h-5 bg-gray-200 mx-1" />

        <ToolbarButton
          title="粗體"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold size={15} />
        </ToolbarButton>
        <ToolbarButton
          title="斜體"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic size={15} />
        </ToolbarButton>
        <ToolbarButton
          title="底線"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon size={15} />
        </ToolbarButton>

        <span className="w-px h-5 bg-gray-200 mx-1" />

        <label
          title="文字顏色"
          className="relative flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-md text-gray-600 hover:bg-gray-200/70"
        >
          <Palette size={15} />
          <span
            className="absolute bottom-1 left-1/2 h-0.5 w-4 -translate-x-1/2"
            style={{
              background:
                editor.getAttributes("styledText").color || "#111827",
            }}
          />
          <input
            type="color"
            className="absolute inset-0 cursor-pointer opacity-0"
            value={editor.getAttributes("styledText").color || "#111827"}
            onChange={(e) =>
              editor.chain().focus().setTextColor(e.target.value).run()
            }
          />
        </label>
        <label
          title="文字背景顏色"
          className="relative flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-md text-gray-600 hover:bg-gray-200/70"
        >
          <Highlighter size={15} />
          <span
            className="absolute bottom-1 left-1/2 h-0.5 w-4 -translate-x-1/2"
            style={{
              background:
                editor.getAttributes("styledText").backgroundColor ||
                "#fde047",
            }}
          />
          <input
            type="color"
            className="absolute inset-0 cursor-pointer opacity-0"
            value={
              editor.getAttributes("styledText").backgroundColor || "#fde047"
            }
            onChange={(e) =>
              editor.chain().focus().setTextBackground(e.target.value).run()
            }
          />
        </label>

        <span className="w-px h-5 bg-gray-200 mx-1" />

        <ToolbarButton
          title="項目清單"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List size={15} />
        </ToolbarButton>
        <ToolbarButton
          title="編號清單"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered size={15} />
        </ToolbarButton>

        <span className="w-px h-5 bg-gray-200 mx-1" />

        <ToolbarButton
          title="靠左"
          active={editor.isActive({ textAlign: "left" })}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
        >
          <AlignLeft size={15} />
        </ToolbarButton>
        <ToolbarButton
          title="置中"
          active={editor.isActive({ textAlign: "center" })}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
        >
          <AlignCenter size={15} />
        </ToolbarButton>
        <ToolbarButton
          title="靠右"
          active={editor.isActive({ textAlign: "right" })}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
        >
          <AlignRight size={15} />
        </ToolbarButton>

        <span className="w-px h-5 bg-gray-200 mx-1" />

        <ToolbarButton
          title="插入連結"
          active={editor.isActive("link")}
          onClick={setLink}
        >
          <LinkIcon size={15} />
        </ToolbarButton>

        <span className="ml-auto flex items-center gap-0.5">
          <ToolbarButton
            title="復原"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            <Undo2 size={15} />
          </ToolbarButton>
          <ToolbarButton
            title="重做"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            <Redo2 size={15} />
          </ToolbarButton>
          <span className="w-px h-5 bg-gray-200 mx-1" />
          <ToolbarButton
            title={showHtmlSource ? "套用 HTML" : "檢視 / 編輯 HTML"}
            active={showHtmlSource}
            onClick={toggleHtmlSource}
          >
            <Code2 size={15} />
          </ToolbarButton>
        </span>
      </div>

      {/* Row 2 */}
      <div className="flex items-center gap-0.5 flex-wrap px-2 py-1.5 border-b border-gray-100 bg-gray-50/60">
        <ToolbarButton
          title="插入圖片"
          onClick={handlePickImage}
          disabled={uploadingImage || showHtmlSource}
        >
          {uploadingImage ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <ImageIcon size={15} />
          )}
        </ToolbarButton>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageFile}
        />
        <ToolbarButton
          title="插入圖片牆（可一次選多張，自動拼貼排版）"
          onClick={handlePickGallery}
          disabled={uploadingGallery || showHtmlSource}
        >
          {uploadingGallery ? (
            <span className="flex items-center gap-1">
              <Loader2 size={15} className="animate-spin" />
              {galleryProgress && (
                <span className="text-[10px] font-mono">{galleryProgress}</span>
              )}
            </span>
          ) : (
            <ImagesIcon size={15} />
          )}
        </ToolbarButton>
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleGalleryFiles}
        />

        <span className="w-px h-5 bg-gray-200 mx-1" />

        <ToolbarButton
          title="插入影片（本機、YouTube 或影片網址）"
          active={showVideoPanel}
          onClick={() => setShowVideoPanel((v) => !v)}
          disabled={showHtmlSource}
        >
          <VideoIcon size={15} />
        </ToolbarButton>
        <ToolbarButton
          title="插入表格"
          onClick={insertTable}
          disabled={showHtmlSource}
        >
          <TableIcon size={15} />
        </ToolbarButton>
        <ToolbarButton
          title="引言"
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          disabled={showHtmlSource}
        >
          <Quote size={15} />
        </ToolbarButton>
        <ToolbarButton
          title="分隔線"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          disabled={showHtmlSource}
        >
          <Minus size={15} />
        </ToolbarButton>

        <span className="w-px h-5 bg-gray-200 mx-1" />

        <ToolbarButton
          title="清除格式"
          onClick={() =>
            editor.chain().focus().clearNodes().unsetAllMarks().run()
          }
          disabled={showHtmlSource}
        >
          <Eraser size={15} />
        </ToolbarButton>

        <span className="ml-auto text-[11px] text-gray-400 font-mono pr-1">
          {chars}/{CONTENT_LIMIT}
        </span>
      </div>

      {showVideoPanel && !showHtmlSource && (
        <div className="border-b border-gray-200 bg-white p-4">
          <div className="mb-4 flex flex-wrap gap-2">
            {[
              { key: "local", label: "本機上傳" },
              { key: "youtube", label: "YouTube" },
              { key: "url", label: "影片網址" },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  setVideoMode(item.key);
                  setVideoUrl("");
                }}
                className={`rounded-full px-4 py-2 text-xs font-bold transition-colors ${
                  videoMode === item.key
                    ? "bg-[#005caf] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {videoMode === "local" ? (
            <div>
              <button
                type="button"
                disabled={uploadingVideo || !uploadVideo}
                onClick={() => videoInputRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-lg bg-[#005caf] px-4 py-2.5 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50"
              >
                {uploadingVideo ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Upload size={15} />
                )}
                {uploadingVideo ? "上傳中…" : "選擇本機影片"}
              </button>
              <input
                ref={videoInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime,.mov"
                className="hidden"
                onChange={handleLocalVideo}
              />
              <p className="mt-2 text-[11px] leading-relaxed text-gray-400">
                支援 MP4、WebM、MOV，最多 25MB。檔案大小與格式會由伺服器再次驗證，影片儲存在 Cloudflare R2。
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    insertVideoUrl();
                  }
                }}
                placeholder={
                  videoMode === "youtube"
                    ? "貼上 YouTube 影片網址"
                    : "貼上直接影片網址（例如 https://.../video.mp4）"
                }
                className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#005caf] focus:outline-none"
              />
              <button
                type="button"
                onClick={insertVideoUrl}
                disabled={!videoUrl.trim()}
                className="rounded-lg bg-[#005caf] px-5 py-2.5 text-xs font-bold text-white hover:opacity-90 disabled:opacity-40"
              >
                插入影片
              </button>
            </div>
          )}
        </div>
      )}

      {showHtmlSource ? (
        <textarea
          value={htmlDraft}
          onChange={(e) => setHtmlDraft(e.target.value)}
          spellCheck={false}
          className="w-full min-h-[320px] px-5 py-4 text-xs font-mono text-gray-700 focus:outline-none resize-y"
          placeholder="<p>HTML 原始碼…</p>"
        />
      ) : (
        <EditorContent editor={editor} />
      )}

      <style jsx global>{`
        .pe-prose p {
          margin: 0 0 0.9em;
          line-height: 1.85;
          color: #1f2430;
        }
        .pe-prose h1 {
          font-size: 1.75em;
          font-weight: 800;
          margin: 1.35em 0 0.55em;
          color: #111;
        }
        .pe-prose h2 {
          font-size: 1.35em;
          font-weight: 700;
          margin: 1.2em 0 0.5em;
          color: #111;
        }
        .pe-prose h3 {
          font-size: 1.12em;
          font-weight: 700;
          margin: 1em 0 0.4em;
          color: #111;
        }
        .pe-prose h4 {
          font-size: 1em;
          font-weight: 700;
          margin: 1em 0 0.4em;
          color: #111;
        }
        .pe-prose h5 {
          font-size: 0.92em;
          font-weight: 700;
          margin: 0.9em 0 0.35em;
          color: #111;
        }
        .pe-prose h6 {
          font-size: 0.82em;
          font-weight: 700;
          margin: 0.9em 0 0.35em;
          color: #4b5563;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .pe-prose ul,
        .pe-prose ol {
          padding-left: 1.3em;
          margin: 0 0 0.9em;
        }
        .pe-prose li {
          margin: 0.25em 0;
        }
        .pe-prose blockquote {
          border-left: 3px solid #005caf;
          margin: 0.9em 0;
          padding: 0.2em 0 0.2em 1em;
          color: #555;
          font-style: italic;
        }
        .pe-prose hr {
          border: none;
          border-top: 1px solid #e5e7eb;
          margin: 1.5em 0;
        }
        .pe-prose .pe-img {
          display: block;
          max-width: 100%;
          border-radius: 10px;
          margin: 1em 0;
        }
        .pe-prose .pe-link {
          color: #005caf;
          text-decoration: underline;
        }
        .pe-prose table {
          width: 100%;
          border-collapse: collapse;
          margin: 1em 0;
        }
        .pe-prose table td,
        .pe-prose table th {
          border: 1px solid #e5e7eb;
          padding: 0.5em 0.75em;
        }
        .pe-prose table th {
          background: #f8fafc;
          font-weight: 700;
        }
        .pe-prose div[data-youtube-video] iframe {
          width: 100%;
          aspect-ratio: 16 / 9;
          border-radius: 10px;
          margin: 1em 0;
        }
        .pe-prose .pe-video {
          display: block;
          width: 100%;
          max-height: 72vh;
          margin: 1em 0;
          background: #000;
        }
        .pe-prose p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          color: #b0b5bd;
          float: left;
          height: 0;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
