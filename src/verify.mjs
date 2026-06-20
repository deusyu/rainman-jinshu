// 复核: render each theme's own source MD through our renderer, diff per-element
// inline styles against mdnice's ground-truth HTML.
// Usage: node src/verify.mjs            (all themes, summary table)
//        node src/verify.mjs 3 --detail (one theme, per-property diffs)
import fs from "node:fs";
import { parseHtml, parseStyle, denoise, normColor } from "./lib.mjs";
import { renderMarkdown, loadTheme } from "./render.mjs";

const COMPARE_TAGS = new Set([
  "h1", "h2", "h3", "h4", "h5", "h6", "p", "blockquote",
  "ul", "ol", "li", "strong", "em", "del", "a", "img", "figure",
  "code", "pre", "hr", "th", "td",
]);

// Collect ordered (key, denoised-style) for elements we care about.
function collect(html) {
  const root = parseHtml(html);
  const list = [];
  const walk = (node, hctx) => {
    for (const el of node.childNodes) {
      if (el.nodeType !== 1) continue;
      const tag = el.rawTagName?.toLowerCase();
      const cls = (el.getAttribute("class") || "").split(/\s+/)[0] || "";
      const style = denoise(parseStyle(el.getAttribute("style") || ""));
      let next = hctx;
      if (/^h[1-6]$/.test(tag)) next = tag;
      if (COMPARE_TAGS.has(tag)) list.push({ key: tag, style });
      if (tag === "span" && hctx && cls) list.push({ key: `${hctx} span.${cls}`, style });
      walk(el, next);
    }
  };
  walk(root, null);
  return list;
}

function groupByKey(list) {
  const m = new Map();
  for (const it of list) {
    if (!m.has(it.key)) m.set(it.key, []);
    m.get(it.key).push(it.style);
  }
  return m;
}

// Dominant (mode) style per key — robust to count mismatches caused by
// markdown-dialect / mdnice-feature differences. Measures theme fidelity:
// "did we reproduce the style this theme assigns to each element type".
function dominant(styles) {
  const tally = new Map();
  for (const s of styles) {
    const sig = JSON.stringify(s);
    const e = tally.get(sig) || { count: 0, style: s };
    e.count++; tally.set(sig, e);
  }
  let best = null;
  for (const e of tally.values()) if (!best || e.count > best.count) best = e;
  return { style: best?.style || {}, variants: tally.size };
}

// Compare one element pair; mdnice is ground truth.
function diffPair(mine, truth) {
  let matched = 0, total = 0;
  const wrong = [];
  for (const [k, v] of Object.entries(truth)) {
    total++;
    const mv = mine[k];
    if (mv !== undefined && normColor(mv) === normColor(v)) matched++;
    else wrong.push({ k, want: v, got: mv ?? "(absent)" });
  }
  return { matched, total, wrong };
}

function verifyTheme(id) {
  const raw = JSON.parse(fs.readFileSync(`themes/raw/${id}.json`, "utf8")).data;
  const theme = loadTheme(id);
  const truthHtml = raw.writing.html;
  const myHtml = renderMarkdown(raw.markdown, theme);

  const truth = groupByKey(collect(truthHtml));
  const mine = groupByKey(collect(myHtml));

  const perKey = [];
  const uncovered = [];
  let aggMatched = 0, aggTotal = 0;
  for (const [key, tArr] of truth) {
    const mArr = mine.get(key) || [];
    // Selectors our renderer never produces for this example aren't scored:
    // they come from mdnice content-transforms not present in standard
    // markdown (e.g. bare-URL→italic footnote). Logged for transparency.
    if (mArr.length === 0) { uncovered.push(`${key}(${tArr.length})`); continue; }
    const dt = dominant(tArr);
    const dm = dominant(mArr);
    const r = diffPair(dm.style, dt.style);
    aggMatched += r.matched; aggTotal += r.total;
    perKey.push({
      key, truthCount: tArr.length, myCount: mArr.length,
      truthVariants: dt.variants, score: r.total ? r.matched / r.total : 1,
      wrong: r.wrong,
    });
  }
  return { id, name: theme.name, score: aggTotal ? aggMatched / aggTotal : 1, perKey, uncovered };
}

if (!fs.existsSync("themes/raw")) {
  console.error("verify 需要 themes/raw/（mdnice 抓取缓存，未入库）作为对比真值。请先抓取 raw 后重试；详见 README「主题来源与署名」。");
  process.exit(1);
}

const arg = process.argv[2];
const detail = process.argv.includes("--detail");
const ids = arg && arg !== "--detail"
  ? [arg]
  : fs.readdirSync("themes/maps").filter((f) => f.endsWith(".json")).map((f) => f.replace(".json", ""));

const results = ids.map(verifyTheme).sort((a, b) => a.score - b.score);

if (detail && ids.length === 1) {
  const r = results[0];
  console.log(`\n=== ${r.name} (id ${r.id})  overall ${(r.score * 100).toFixed(1)}% ===`);
  for (const k of r.perKey.sort((a, b) => a.score - b.score)) {
    const flag = k.truthCount !== k.myCount ? `  ⚠ count ${k.myCount}/${k.truthCount}` : "";
    console.log(`\n  [${k.key}] ${(k.score * 100).toFixed(0)}%${flag}`);
    for (const w of k.wrong.slice(0, 8)) console.log(`     ${w.k}: want ${w.want} | got ${w.got}`);
  }
} else {
  console.log("score\tid\ttheme\t\tlow-scoring selectors  | uncovered(transform-only)");
  for (const r of results) {
    const lows = r.perKey.filter((k) => k.score < 0.999).map((k) => `${k.key}:${(k.score*100)|0}%`).slice(0, 6).join(" ");
    const unc = r.uncovered.length ? `  | ${r.uncovered.join(" ")}` : "";
    console.log(`${(r.score * 100).toFixed(1)}%\t${r.id}\t${r.name}\t${lows}${unc}`);
  }
  const avg = results.reduce((s, r) => s + r.score, 0) / results.length;
  const perfect = results.filter((r) => r.score > 0.999).length;
  console.log(`\nmean fidelity across ${results.length} themes: ${(avg * 100).toFixed(1)}%  |  exact (100%): ${perfect}/${results.length}`);
}
