// 渲染断言冒烟：用 sample.md 渲染一个主题，断言关键元素带内联样式、结构正确。
// 不依赖 themes/raw/，可在 CI 跑。用法：bun test/smoke.mjs
import fs from "node:fs";
import { renderMarkdown, loadTheme } from "../src/render.mjs";

const md = fs.readFileSync("sample.md", "utf8");
const html = renderMarkdown(md, loadTheme("3"));

// 只断言 render 机制必然产出的核心结构。a/li/pre/td 是否带内联样式取决于主题
// 是否定义该 selector（mdnice 的 li 常无内联样式、靠 ul 继承），不在此强校验。
const checks = [
  ["输出非空", html.length > 100],
  ["二级标题带内联样式", /<h2[^>]*\sstyle="/.test(html)],
  ["标题 content span 包裹（mdnice 结构）", /<span class="content"/.test(html)],
  ["段落带内联样式", /<p[^>]*\sstyle="/.test(html)],
  ["加粗带内联样式", /<strong[^>]*\sstyle="/.test(html)],
  ["列表容器 ul 带内联样式", /<ul[^>]*\sstyle="/.test(html)],
  ["图片包进 figure（mdnice 结构）", /<figure[^>]*>\s*<img/.test(html)],
  ["代码块已渲染", /<pre[\s>]/.test(html)],
  ["无外层 section（避免公众号灰底）", !/^\s*<section[\s>]/.test(html)],
];

let failed = 0;
for (const [name, ok] of checks) {
  console.log(`${ok ? "✓" : "✗"} ${name}`);
  if (!ok) failed++;
}
console.log(`\nsmoke: ${checks.length - failed}/${checks.length} passed`);
process.exit(failed ? 1 : 0);
