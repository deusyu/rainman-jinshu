// 锦书发文：md + 主题 → 锦书内联 HTML → 调 baoyu-post-to-wechat 存草稿。
// 用法：
//   bun src/publish.mjs <file.md> <themeId> [--submit] [--author 名] [--cdp-port 9222]
// 默认存草稿箱（不 --submit）。复用浏览器/CDP 路，保住全部 28 主题。
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";
import { renderMarkdown, loadTheme } from "./render.mjs";

// Resolve baoyu-post-to-wechat's wechat-article.ts:
//   1. env BAOYU_POST_TO_WECHAT (a .ts file, or the skill dir)
//   2. auto-detect under ~/.claude (plugin marketplaces or installed skills)
const SCRIPT_REL = "scripts/wechat-article.ts";
function resolveBaoyu() {
  const env = process.env.BAOYU_POST_TO_WECHAT;
  if (env) {
    const p = env.endsWith(".ts") ? env : path.join(env, SCRIPT_REL);
    if (fs.existsSync(p)) return p;
    throw new Error(`BAOYU_POST_TO_WECHAT 指向的路径不存在：${p}`);
  }
  const home = os.homedir();
  const cand = [path.join(home, ".claude/skills/baoyu-post-to-wechat", SCRIPT_REL)];
  const mk = path.join(home, ".claude/plugins/marketplaces");
  try {
    for (const d of fs.readdirSync(mk)) {
      cand.push(path.join(mk, d, "skills/baoyu-post-to-wechat", SCRIPT_REL));
    }
  } catch {}
  const hit = cand.find((p) => fs.existsSync(p));
  if (hit) return hit;
  throw new Error(
    "找不到 baoyu-post-to-wechat。请安装该 skill，或设环境变量 BAOYU_POST_TO_WECHAT 指向其 scripts/wechat-article.ts 或 skill 目录。"
  );
}
const BAOYU = resolveBaoyu();

function splitTitle(md) {
  const m = md.match(/^\s*#\s+(.+?)\s*$/m);
  if (m && md.slice(0, m.index).trim() === "") {
    return { title: m[1].replace(/[*`_]/g, ""), body: md.slice(m.index + m[0].length).replace(/^\n+/, "") };
  }
  return { title: "未命名文章", body: md };
}

const args = process.argv.slice(2);
const mdFile = args[0];
const themeId = args[1];
if (!mdFile || !themeId) { console.error("usage: bun src/publish.mjs <file.md> <themeId> [--submit] [--author 名] [--cdp-port N]"); process.exit(1); }
const submit = args.includes("--submit");
const authorI = args.indexOf("--author");
const author = authorI >= 0 ? args[authorI + 1] : "";
const portI = args.indexOf("--cdp-port");
const cdpPort = portI >= 0 ? args[portI + 1] : "9222";

const md = fs.readFileSync(mdFile, "utf8");
const { title, body } = splitTitle(md);
const theme = loadTheme(themeId);
const section = renderMarkdown(body, theme); // render.mjs handles fallback internally

const out = path.join(os.tmpdir(), `jinshu-${themeId}-${Date.now()}.html`);
fs.writeFileSync(out, `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title></head><body>${section}</body></html>`);
console.log(`[jinshu] 渲染「${theme.name}」→ ${out}\n[jinshu] 标题：${title}`);

const cmd = ["-y", "bun", BAOYU, "--html", out, "--title", title, "--cdp-port", cdpPort];
if (author) cmd.push("--author", author);
if (submit) cmd.push("--submit");
console.log(`[jinshu] → wechat-article.ts (${submit ? "群发提交" : "存草稿"})`);
const r = spawnSync("npx", cmd, { stdio: "inherit" });
process.exit(r.status ?? 0);
