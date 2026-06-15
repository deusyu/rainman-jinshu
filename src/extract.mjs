// Extract a reusable per-element style map from one theme's mdnice inlined HTML.
// Usage: node src/extract.mjs            (all cached themes)
//        node src/extract.mjs 3          (single theme id)
import fs from "node:fs";
import path from "node:path";
import { parseHtml, parseStyle } from "./lib.mjs";

const RAW = "themes/raw";
const OUT = "themes/maps";
fs.mkdirSync(OUT, { recursive: true });

// Tags whose first-seen inline style we capture as the canonical rule.
const BLOCK_TAGS = new Set([
  "h1", "h2", "h3", "h4", "h5", "h6", "p", "blockquote",
  "ul", "ol", "li", "pre", "img", "figure", "figcaption", "hr",
  "table", "thead", "tbody", "tr", "th", "td",
]);
const INLINE_TAGS = new Set(["strong", "em", "del", "a", "code", "sup", "sub"]);

function extractTheme(id) {
  const raw = JSON.parse(fs.readFileSync(path.join(RAW, `${id}.json`), "utf8"));
  const d = raw.data;
  const html = d?.writing?.html;
  if (!html) return null;
  const root = parseHtml(html);

  // Collect every occurrence per selector, then pick the dominant (mode) style.
  // First-occurrence is unreliable: the first <p>/<strong>/<img> is often a
  // non-representative variant (e.g. inside a quote), not the theme's norm.
  const buckets = {};    // selector -> [styleStr, ...]
  const record = (key, styleStr) => {
    (buckets[key] ||= []).push(styleStr || "");
  };

  // Container: outermost element carrying base font/color (mdnice wraps in
  // <section id="nice"> or a top section). Capture the first styled section.
  const top = root.querySelector("section[id], section[data-tool]") || root.querySelector("section");
  if (top) record("container", top.getAttribute("style") || "");

  const walk = (node, headingCtx) => {
    for (const el of node.childNodes) {
      if (el.nodeType !== 1) continue;
      const tag = el.rawTagName?.toLowerCase();
      const cls = (el.getAttribute("class") || "").split(/\s+/)[0] || "";
      const style = el.getAttribute("style") || "";

      if (BLOCK_TAGS.has(tag) || INLINE_TAGS.has(tag)) record(tag, style);

      // Heading decorative spans: h* > span.prefix/.content/.suffix
      let nextCtx = headingCtx;
      if (/^h[1-6]$/.test(tag)) nextCtx = tag;
      if (tag === "span" && headingCtx && cls) {
        record(`${headingCtx} span.${cls}`, style);
      }
      // Inline code vs code-block code
      if (tag === "code") {
        const inPre = node.rawTagName?.toLowerCase() === "pre";
        record(inPre ? "pre code" : "code", style);
      }
      walk(el, nextCtx);
    }
  };
  walk(root, null);

  // Reduce each bucket to its dominant non-empty style string.
  const map = {};
  const counts = {};
  for (const [key, arr] of Object.entries(buckets)) {
    counts[key] = arr.length;
    const tally = new Map();
    for (const s of arr) {
      if (!s) continue;
      tally.set(s, (tally.get(s) || 0) + 1);
    }
    let best = null;
    for (const [s, c] of tally) if (!best || c > best.c) best = { s, c };
    if (best) map[key] = best.s;
  }

  return {
    id: String(id),
    name: d.name,
    description: d.description,
    selectors: map,
    counts,
  };
}

const ids = process.argv[2]
  ? [process.argv[2]]
  : fs.readdirSync(RAW).filter((f) => f.endsWith(".json")).map((f) => f.replace(".json", ""));

let ok = 0;
const summary = [];
for (const id of ids) {
  const t = extractTheme(id);
  if (!t) { summary.push(`${id}\tSKIP (no html)`); continue; }
  fs.writeFileSync(path.join(OUT, `${id}.json`), JSON.stringify(t, null, 2));
  ok++;
  summary.push(`${id}\t${t.name}\t${Object.keys(t.selectors).length} selectors`);
}
console.log(summary.join("\n"));
console.log(`\nextracted ${ok}/${ids.length} themes -> ${OUT}/`);
