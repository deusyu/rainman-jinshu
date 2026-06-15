// Bundle all theme maps + metadata into one browser-loadable JSON.
import fs from "node:fs";

function prop(style, name) {
  const m = (style || "").split(";").map(s => s.trim()).find(s => s.startsWith(name + ":") || s.startsWith(name + " :"));
  return m ? m.split(":").slice(1).join(":").trim() : null;
}
function parseRGB(v) {
  if (!v) return null;
  const m = v.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const p = m[1].split(",").map(x => parseFloat(x));
  return { r: p[0], g: p[1], b: p[2], a: p[3] ?? 1 };
}
function colorScore(c) {
  if (!c || c.a < 0.35) return -1;
  const mx = Math.max(c.r, c.g, c.b), mn = Math.min(c.r, c.g, c.b);
  const sat = mx === 0 ? 0 : (mx - mn) / mx;
  const lum = (c.r + c.g + c.b) / 3;
  if (lum > 240 || lum < 18) return -1;            // skip near white/black
  return sat * 100 + (mx - mn) * 0.2;
}
// Representative accent color for the theme, from its decorative props.
function accentOf(sel) {
  const cands = [];
  const add = (k, p) => { const v = prop(sel[k], p); if (v) cands.push(v); };
  add("blockquote", "border-left-color");
  add("h3", "color"); add("h3", "border-left-color"); add("h3", "border-bottom-color");
  add("h2", "border-bottom-color"); add("h2", "background-color");
  add("a", "color"); add("strong", "color"); add("strong", "border-bottom-color");
  add("ul", "color");
  let best = "#9b8a7a", bestS = -1;
  for (const v of cands) { const s = colorScore(parseRGB(v)); if (s > bestS) { bestS = s; best = v; } }
  return best;
}

const ids = fs.readdirSync("themes/maps").filter(f=>f.endsWith(".json")).map(f=>f.replace(".json",""));
const themes = ids.map(id=>{
  const m = JSON.parse(fs.readFileSync(`themes/maps/${id}.json`,"utf8"));
  let cover="";
  try { cover = JSON.parse(fs.readFileSync(`themes/raw/${id}.json`,"utf8")).data.cover || ""; } catch {}
  return { id:m.id, name:(m.name||"").trim(), description:(m.description||"").trim(), cover, accent:accentOf(m.selectors), selectors:m.selectors };
}).sort((a,b)=>a.name.localeCompare(b.name,"zh"));
fs.writeFileSync("themes.json", JSON.stringify(themes));
console.log(`bundled ${themes.length} themes -> themes.json (${(fs.statSync("themes.json").size/1024).toFixed(0)} KB)`);
console.log(themes.map(t=>t.name).join("  "));
