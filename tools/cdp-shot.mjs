// bun tools/cdp-shot.mjs [url] [outPng] — screenshot a Chrome tab via CDP 9222.
// Also prints the current page URL (used to detect login state).
import fs from "node:fs";
const url = process.argv[2] || "https://mp.weixin.qq.com/";
const out = process.argv[3] || "/tmp/jinshu-qr.png";
const navigate = process.argv[4] !== "nonav";

const list = await (await fetch("http://localhost:9222/json")).json();
let page = list.find((t) => t.type === "page" && /weixin/.test(t.url)) || list.find((t) => t.type === "page");
if (!page) { console.error("no page target"); process.exit(1); }

const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0; const pend = {};
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend[m.id]) { pend[m.id](m.result); delete pend[m.id]; } };
await new Promise((r) => ws.addEventListener("open", r));

await send("Page.enable");
if (navigate) { await send("Page.navigate", { url }); await new Promise((r) => setTimeout(r, 5500)); }
const cur = await send("Runtime.evaluate", { expression: "location.href", returnByValue: true });
console.log("URL:", cur?.result?.value);
const shot = await send("Page.captureScreenshot", { format: "png" });
fs.writeFileSync(out, Buffer.from(shot.data, "base64"));
console.log("saved", out);
process.exit(0);
