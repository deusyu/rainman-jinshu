// Shared helpers: style parsing + noise filtering.
import { parse as parseHtml } from "node-html-parser";

export { parseHtml };

// CSS properties that mdnice always inlines as no-op defaults. They carry no
// design signal, so we ignore them when comparing/denoising.
export const NOISE_DEFAULTS = {
  "background-attachment": "scroll",
  "background-clip": "border-box",
  "background-origin": "padding-box",
  "background-position-x": "0%",
  "background-position-y": "0%",
  "background-repeat": "no-repeat",
  "background-size": "auto",
  "align-items": "unset",
  "flex-direction": "unset",
  "float": "unset",
  "justify-content": "unset",
  "overflow-x": "unset",
  "overflow-y": "unset",
  "text-shadow": "none",
  "transform": "none",
  "-webkit-box-reflect": "unset",
  "box-shadow": "none",
};

export function parseStyle(style) {
  const out = {};
  if (!style) return out;
  for (const part of style.split(";")) {
    const i = part.indexOf(":");
    if (i < 0) continue;
    const k = part.slice(0, i).trim().toLowerCase();
    const v = part.slice(i + 1).trim();
    if (k) out[k] = v;
  }
  return out;
}

// Drop properties whose value equals the known no-op default.
export function denoise(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (NOISE_DEFAULTS[k] !== undefined && NOISE_DEFAULTS[k] === v) continue;
    out[k] = v;
  }
  return out;
}

export function normColor(v) {
  // rgb(0, 0, 0) -> rgb(0,0,0) so spacing differences don't count as diffs
  return v.replace(/\s+/g, " ").replace(/,\s+/g, ",").trim();
}
