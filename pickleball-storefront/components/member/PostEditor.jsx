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
  Table as TableIcon,
  Youtube as YoutubeIcon,
  Eraser,
  Code2,
  Quote,
  Minus,
  Undo2,
  Redo2,
  ChevronDown,
  Loader2,
} from "lucide-react";

const CONTENT_LIMIT = 12000;

const PARAGRAPH_STYLES = [
  { value: "p", label: "一般文字" },
  { value: "h2", label: "標題 2" },
  { value: "h3", label: "標題 3" },
  { value: "h4", label: "標題 4" },
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
  const current = editor.isActive("heading", { level: 2 })
    ? "h2"
    : editor.isActive("heading", { level: 3 })
      ? "h3"
      : editor.isActive("heading", { level: 4 })
        ? "h4"
        : "p";

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

export default function PostEditor({ content, onChange, uploadImage }) {
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showHtmlSource, setShowHtmlSource] = useState(false);
  const [htmlDraft, setHtmlDraft] = useState("");
  const fileInputRef = useRef(null);

  const extensions = useMemo(
    () => [
      StarterKit.configure({ heading: { levels: [2, 3, 4] } }),
      Underline,
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
      Placeholder.configure({
        placeholder: "分享課程亮點、活動細節，或給球友的小提醒…",
      }),
      CharacterCount.configure({ limit: CONTENT_LIMIT }),
    ],
    [],
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

  const insertYoutube = useCallback(() => {
    const url = window.prompt("輸入 YouTube 影片網址");
    if (!url) return;
    editor?.commands.setYoutubeVideo({ src: url });
  }, [editor]);

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
          title="插入 YouTube 影片"
          onClick={insertYoutube}
          disabled={showHtmlSource}
        >
          <YoutubeIcon size={15} />
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
