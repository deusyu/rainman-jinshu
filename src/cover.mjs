// 封面生成器：标题 + 主题色 → 公众号封面 PNG（900×383 大图 / 383×383 方图）。
// 纯排版、无 AI、无重依赖：用系统 Chrome 的 --headless --screenshot 渲染。
// 用法：
//   bun src/cover.mjs --title "标题" [--accent "#07C160"] [--out cover.png]
//                     [--square] [--wordmark 锦书] [--tagline 云中谁寄锦书来]
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

function arg(name, def) { const i = process.argv.indexOf(name); return i >= 0 ? process.argv[i + 1] : def; }
const has = (name) => process.argv.includes(name);

const title = arg("--title", "未命名文章");
const accent = arg("--accent", "#07C160");
const wordmark = arg("--wordmark", "锦书");
const tagline = arg("--tagline", "云中谁寄锦书来");
const square = has("--square");
const W = square ? 383 : 900, H = 383;
const out = arg("--out", path.join(os.tmpdir(), `jinshu-cover-${square ? "sq" : "wide"}-${Date.now()}.png`));

function findChrome() {
  const cands = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    process.env.CHROME_PATH, "google-chrome", "chromium", "chromium-browser",
  ].filter(Boolean);
  for (const c of cands) { if (c.includes("/") ? fs.existsSync(c) : true) return c; }
  return "google-chrome";
}

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const html = `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@500;700&family=Noto+Sans+SC:wght@500&display=swap" rel="stylesheet">
<style>
  *{margin:0;box-sizing:border-box}
  html,body{width:${W}px;height:${H}px}
  .card{position:relative;width:${W}px;height:${H}px;background:#FBFAF5;overflow:hidden;
    font-family:'Noto Serif SC','Songti SC',serif;display:flex;flex-direction:column;
    justify-content:space-between;padding:${square ? "40px 38px" : "48px 56px"};}
  .bar{position:absolute;left:0;top:0;bottom:0;width:10px;background:${accent}}
  .accentdot{width:13px;height:13px;border-radius:50%;background:${accent};box-shadow:0 0 0 4px ${accent}22}
  .top{display:flex;align-items:center;gap:10px}
  .wm{font-weight:700;font-size:20px;color:#211F1A;letter-spacing:.12em}
  .title{font-weight:700;color:#1A1B1D;letter-spacing:.005em;
    font-size:${square ? "34px" : "46px"};line-height:1.32;
    display:-webkit-box;-webkit-line-clamp:${square ? 4 : 3};-webkit-box-orient:vertical;overflow:hidden}
  .foot{display:flex;align-items:flex-end;justify-content:space-between}
  .tag{font-size:${square ? "15px" : "17px"};color:#73716A;letter-spacing:.18em}
  .en{font-family:'Noto Sans SC',sans-serif;font-size:12px;color:${accent};letter-spacing:.22em;font-weight:500}
</style></head>
<body><div class="card">
  <div class="bar"></div>
  <div class="top"><span class="accentdot"></span><span class="wm">${esc(wordmark)}</span></div>
  <div class="title">${esc(title)}</div>
  <div class="foot"><span class="tag">${esc(tagline)}</span><span class="en">JINSHU</span></div>
</div></body></html>`;

const tmpHtml = path.join(os.tmpdir(), `jinshu-cover-${Date.now()}.html`);
fs.writeFileSync(tmpHtml, html);

const chrome = findChrome();
const r = spawnSync(chrome, [
  "--headless", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=2",
  "--virtual-time-budget=3500", `--window-size=${W},${H}`, `--screenshot=${out}`,
  `file://${tmpHtml}`,
], { stdio: "ignore" });
fs.rmSync(tmpHtml, { force: true });
if (r.status !== 0 || !fs.existsSync(out)) { console.error("[cover] Chrome 渲染失败，CHROME_PATH 可指定 Chrome 路径"); process.exit(1); }
console.log(out);
