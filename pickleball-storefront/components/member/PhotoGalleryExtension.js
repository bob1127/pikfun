import { Node } from "@tiptap/core";

/**
 * 圖片牆節點：一次插入多張圖片，前台與編輯器依張數（data-count）
 * 自動套用不同的拼貼版型（CSS 定義於 globals.css 的 .pe-gallery）。
 * 輸出 HTML：<div class="pe-gallery" data-count="N"><img …/>…</div>
 */
const PhotoGallery = Node.create({
  name: "photoGallery",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      images: {
        default: [],
        parseHTML: (el) =>
          Array.from(el.querySelectorAll("img"))
            .map((img) => img.getAttribute("src"))
            .filter(Boolean),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div.pe-gallery" }];
  },

  renderHTML({ node }) {
    const images = Array.isArray(node.attrs.images) ? node.attrs.images : [];
    return [
      "div",
      { class: "pe-gallery", "data-count": String(images.length) },
      ...images.map((src) => ["img", { src, loading: "lazy", alt: "" }]),
    ];
  },

  addCommands() {
    return {
      insertPhotoGallery:
        (images) =>
        ({ commands }) => {
          if (!Array.isArray(images) || images.length === 0) return false;
          return commands.insertContent({
            type: this.name,
            attrs: { images },
          });
        },
    };
  },
});

export default PhotoGallery;
