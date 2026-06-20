# 更新日志

格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [0.1.0] - 2026-06-20

首个公开发布版（开源引擎 + skill）。

### 功能
- mdnice 风格主题渲染：28 款主题，逐元素内联样式、对齐 mdnice 原版。
- 公众号发草稿：`publish.mjs` 经浏览器 / CDP 复用 `baoyu-post-to-wechat`，不重写微信侧逻辑。
- 品牌封面生成：`cover.mjs`（900×383 大图 / 383×383 方图）。
- Claude Code skill：触发词 jinshu / 锦书 / 公众号排版。

### 数据与可重建
- `themes/maps/`（样式事实源）+ `themes/covers.json`（封面 URL，入库）→ `bundle.mjs` 打包出 `themes.json`，无需 `themes/raw/` 即可完整重建。
- `bun src/bundle.mjs --check`：`themes.json` 漂移校验。

### 工程
- CI（GitHub Actions）：漂移校验 + 渲染断言冒烟（`test/smoke.mjs`）。
- issue / PR 模板、`.editorconfig`。
- `package.json` 元数据齐全、`engines` 声明 bun、`scripts` 入口；依赖精简为 `marked` + `node-html-parser`。
- `render` / `verify` 在缺少 `themes/raw/` 时给出友好提示而非崩溃。
