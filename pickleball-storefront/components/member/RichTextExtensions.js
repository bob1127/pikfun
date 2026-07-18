import { Mark, Node, mergeAttributes } from "@tiptap/core";

const SAFE_COLOR = /^(#[0-9a-f]{3,8}|rgba?\([\d\s,.%]+\)|transparent)$/i;

function safeColor(value) {
  const color = String(value || "").trim();
  return SAFE_COLOR.test(color) ? color : null;
}

export const StyledText = Mark.create({
  name: "styledText",

  addAttributes() {
    return {
      color: {
        default: null,
        parseHTML: (element) => safeColor(element.style.color),
      },
      backgroundColor: {
        default: null,
        parseHTML: (element) => safeColor(element.style.backgroundColor),
      },
    };
  },

  parseHTML() {
    return [{ tag: "span[style]" }];
  },

  renderHTML({ HTMLAttributes }) {
    const styles = [];
    const color = safeColor(HTMLAttributes.color);
    const background = safeColor(HTMLAttributes.backgroundColor);
    if (color) styles.push(`color: ${color}`);
    if (background) styles.push(`background-color: ${background}`);
    return ["span", { style: styles.join("; ") }, 0];
  },

  addCommands() {
    return {
      setTextColor:
        (color) =>
        ({ commands, editor }) =>
          commands.setMark(this.name, {
            ...editor.getAttributes(this.name),
            color: safeColor(color),
          }),
      setTextBackground:
        (backgroundColor) =>
        ({ commands, editor }) =>
          commands.setMark(this.name, {
            ...editor.getAttributes(this.name),
            backgroundColor: safeColor(backgroundColor),
          }),
      unsetTextStyle:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name),
    };
  },
});

export const Video = Node.create({
  name: "video",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: (element) => element.getAttribute("src"),
      },
    };
  },

  parseHTML() {
    return [{ tag: "video[src]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "video",
      mergeAttributes(HTMLAttributes, {
        class: "pe-video",
        controls: "controls",
        preload: "metadata",
        playsinline: "playsinline",
      }),
    ];
  },

  addCommands() {
    return {
      setVideo:
        ({ src }) =>
        ({ commands }) => {
          let url;
          try {
            url = new URL(src);
          } catch {
            return false;
          }
          if (!["http:", "https:"].includes(url.protocol)) return false;
          return commands.insertContent({
            type: this.name,
            attrs: { src: url.toString() },
          });
        },
    };
  },
});
