// Render markdown into mdnice-structured, inline-styled HTML using a theme map.
import fs from "node:fs";
import { marked } from "marked";
import { parseHtml } from "./lib.mjs";

// Default theme (橙心, id 1) is mdnice's base; used as fallback for selectors a
// sparse theme example never exercised.
let DEFAULT_MAP = null;
function defaultMap() {
  if (DEFAULT_MAP === null) {
    try { DEFAULT_MAP = JSON.parse(fs.readFileSync("themes/maps/1.json", "utf8")).selectors; }
    catch { DEFAULT_MAP = {}; }
  }
  return DEFAULT_MAP;
}

export function loadTheme(id) {
  return JSON.parse(fs.readFileSync(`themes/maps/${id}.json`, "utf8"));
}

const HEADING_FALLBACK = ["h2", "h3", "h1", "h4", "h5", "h6"];

export function renderMarkdown(md, theme) {
  const sel = theme.selectors;
  const fallback = defaultMap();
  // A theme often styles only the heading levels its example used (WeChat
  // bodies start at h2). For a missing level, borrow the theme's nearest
  // defined heading before falling back to the base theme.
  const styleFor = (key) => {
    if (sel[key] != null) return sel[key];
    const m = /^h([1-6])(?: span\.(\w+))?$/.exec(key);
    if (m) {
      const span = m[2] ? ` span.${m[2]}` : "";
      for (const h of HEADING_FALLBACK) if (sel[`${h}${span}`] != null) return sel[`${h}${span}`];
    }
    return fallback[key];
  };

  const html = marked.parse(md, { mangle: false, headerIds: false });
  const root = parseHtml(`<div>${html}</div>`).firstChild;

  const apply = (node) => {
    for (const el of node.childNodes) {
      if (el.nodeType !== 1) continue;
      const tag = el.rawTagName?.toLowerCase();

      // Headings: wrap inner content in prefix/content/suffix spans (mdnice).
      if (/^h[1-6]$/.test(tag)) {
        const s = styleFor(tag);
        if (s) el.setAttribute("style", s);
        apply(el); // style inline children (strong/em/code/a) before wrapping
        const inner = el.innerHTML;
        const pfx = styleFor(`${tag} span.prefix`);
        const cnt = styleFor(`${tag} span.content`);
        const sfx = styleFor(`${tag} span.suffix`);
        el.set_content(
          `<span class="prefix"${pfx ? ` style="${pfx}"` : ""}></span>` +
          `<span class="content"${cnt ? ` style="${cnt}"` : ""}>${inner}</span>` +
          `<span class="suffix"${sfx ? ` style="${sfx}"` : ""}></span>`
        );
        continue; // inner spans already styled
      }

      // Inline code vs fenced code.
      if (tag === "code") {
        const inPre = node.rawTagName?.toLowerCase() === "pre";
        const s = styleFor(inPre ? "pre code" : "code");
        if (s) el.setAttribute("style", s);
      } else {
        const s = styleFor(tag);
        if (s) el.setAttribute("style", s);
      }

      // Images: mdnice wraps <img> in <figure>.
      if (tag === "img") {
        const fs_ = styleFor("figure");
        if (fs_) {
          const imgStyle = styleFor("img");
          el.replaceWith(
            parseHtml(
              `<figure style="${fs_}"><img${imgStyle ? ` style="${imgStyle}"` : ""} ${el.rawAttrs}></figure>`
            )
          );
          continue;
        }
      }
      apply(el);
    }
  };
  apply(root);

  const container = styleFor("container");
  return `<section${container ? ` style="${container}"` : ""}>${root.innerHTML}</section>`;
}

// CLI: node src/render.mjs <themeId> [markdownFile]  -> prints HTML
if (import.meta.url === `file://${process.argv[1]}`) {
  const id = process.argv[2];
  const theme = loadTheme(id);
  const md = process.argv[3]
    ? fs.readFileSync(process.argv[3], "utf8")
    : JSON.parse(fs.readFileSync(`themes/raw/${id}.json`, "utf8")).data.markdown;
  process.stdout.write(renderMarkdown(md, theme));
}
