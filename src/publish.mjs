// 锦书发文：md + 主题 → 锦书内联 HTML → 调 baoyu-post-to-wechat 存草稿。
// 用法：
//   bun src/publish.mjs <file.md> <themeId> [--submit] [--author 名] [--cdp-port 9222]
// 默认存草稿箱（不 --submit）。复用浏览器/CDP 路，保住全部 28 主题。
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";
import { renderMarkdown, loadTheme } from "./render.mjs";

const BAOYU = "/Users/daniel/.claude/plugins/marketplaces/baoyu-skills/skills/baoyu-post-to-wechat/scripts/wechat-article.ts";

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
