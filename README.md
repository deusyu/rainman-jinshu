# 锦书 Jinshu · 引擎与 skill

> 让每篇公众号，都像一封锦书。

[![CI](https://github.com/deusyu/rainman-jinshu/actions/workflows/ci.yml/badge.svg)](https://github.com/deusyu/rainman-jinshu/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

把 Markdown 用 mdnice 风格主题排版成**微信公众号样式**——逐元素内联样式、与 mdnice 原版对齐；并可经 Claude Code 直接发到公众号草稿箱。

这是**开源引擎 + skill** 部分。品牌站点（锦书 web）单独私有。

## 特性

- **28 款主题**，逐元素内联样式，与 mdnice 原版对齐。
- **扁平输出**：不套外层 `<section>`，避免粘进公众号被套灰底。
- **一键发草稿**：复用 `baoyu-post-to-wechat`，走浏览器 / CDP，不重写微信侧逻辑。
- **自动封面**：纯排版生成大图 900×383 / 方图 383×383，贴主题代表色。
- **数据可重建 + 防漂移**：主题样式与封面入库，`bundle --check` + CI 守护一致性。
- **Claude Code skill**：一句「用锦书排版」即可渲染、发文。

## 安装

前置：[Bun](https://bun.sh)。发草稿另需 Chrome、已登录的公众号后台，以及 [`baoyu-post-to-wechat`](https://github.com/JimLiu/baoyu-skills) skill。

```bash
bun install
```

## 快速开始

```bash
# 渲染 sample.md（主题 3 = 姹紫），输出内联 HTML
bun src/render.mjs 3 sample.md > out.html

# 渲染并发到公众号草稿箱（需 Chrome + 已登录后台 + baoyu skill）
bun src/publish.mjs sample.md 3 --author 锦书
```

把 `out.html` 全选复制粘贴进公众号编辑器即可；或直接用 `publish` 发草稿。

## 能力

| 用法 | 命令 |
|------|------|
| 仅渲染（内联 HTML） | `bun src/render.mjs <themeId> <file.md>` |
| 渲染 + 发草稿箱 | `bun src/publish.mjs <file.md> <themeId> [--author 名]` |
| 渲染 + 群发提交 | `bun src/publish.mjs <file.md> <themeId> --submit` |
| 生成品牌封面 | `bun src/cover.mjs --title "标题" [--accent rgb(..)] [--square]` |
| 复核主题保真度 | `bun src/verify.mjs [themeId --detail]`（需先抓取 `themes/raw/`） |
| 打包 themes.json | `bun src/bundle.mjs` |
| 校验 themes.json 未漂移 | `bun src/bundle.mjs --check` |
| （可选）重抓主题 | `bun src/extract.mjs`（需先抓取 `themes/raw/`） |

`package.json` 也提供脚本别名，常用如 `bun run check`、`bun run test`。

themeId 见 `themes/maps/`（共 28 款，如 `3`=姹紫、`44`=Obsidian、`1`=橙心默认）。

## 工作原理

1. **extract** — 从 mdnice 公开 API 抓取的逐元素计算样式（`themes/raw/`）中，按"出现最多的样式"提取每个标签的规则，存成 `themes/maps/<id>.json`。
2. **render** — `marked` 解析 Markdown，按主题 map 给每个元素打内联 `style`，复刻 mdnice 的 DOM 结构（标题 `prefix/content/suffix` span、`<img>` 包 `<figure>`），输出扁平 HTML。
3. **bundle** — `maps` + `covers.json` 打包成 `themes.json`，供 web / skill 消费。
4. **verify** — 用 map 重新渲染并与原始真值比对，量化保真度。

## 项目结构

```
src/
  render.mjs    # md + 主题 → 内联 HTML（核心渲染）
  publish.mjs   # render + 调 baoyu-post-to-wechat 发草稿 / 群发
  cover.mjs     # 标题 + 主题色 → 封面 PNG（Chrome headless）
  bundle.mjs    # maps + covers → themes.json（--check 校验漂移）
  extract.mjs   # mdnice 原始 HTML → 逐元素样式 map
  verify.mjs    # 渲染结果 vs 原始真值，保真度复核
  lib.mjs       # 共享：样式解析 / 去噪 / 颜色归一
tools/
  cdp-shot.mjs  # 经 CDP 截图（登录态检测 / 取二维码）
themes/
  maps/*.json   # 逐元素样式映射（事实源）
  covers.json   # 各主题封面图 URL（事实源）
  themes.json   # 打包产物（入库；web / skill 消费）
  raw/          # mdnice 抓取缓存（不入库）
skills/rainman-jinshu/SKILL.md   # Claude Code skill
test/smoke.mjs                   # 渲染断言冒烟
```

## 作为 Claude Code skill

`skills/rainman-jinshu/SKILL.md`，触发词 **jinshu / 锦书 / 公众号排版**。例如对 Claude 说「用锦书把这篇 md 排成姹紫主题发草稿」。

发草稿走浏览器 / CDP，**复用** [`baoyu-post-to-wechat`](https://github.com/JimLiu/baoyu-skills)（依赖其脚本，不重写微信侧逻辑）。`src/publish.mjs` 会自动探测该 skill（`~/.claude` 下插件市场或已装 skill）；探测不到时，设环境变量 `BAOYU_POST_TO_WECHAT` 指向其 `scripts/wechat-article.ts` 或 skill 目录。

## 主题数据

`themes/maps/`（28 款逐元素样式映射）与 `themes/covers.json`（各主题封面图 URL）是**事实源**；`themes.json` 由 `bun src/bundle.mjs` 打包二者生成并入库，`bun src/bundle.mjs --check` 校验其未漂移。锦书 web（私有）以同步副本（vendoring）复用本仓 `themes.json`，并非各自维护。

> `themes/raw/`（mdnice 抓取缓存）不入库；封面 URL 已抽出至 `themes/covers.json`，因此无需 raw 也能完整重建 `themes.json`。

## 开发

```bash
bun run check    # 校验 themes.json 未漂移
bun run test     # 渲染断言冒烟（不依赖 raw）
```

CI（GitHub Actions）在每次 push / PR 跑上面两项。

新增 / 更新主题：抓取 mdnice 原始 HTML 到 `themes/raw/<id>.json` → `bun src/extract.mjs <id>` → 在 `themes/covers.json` 补该主题封面 URL → `bun src/bundle.mjs` 重打包。

## 主题来源与署名（请阅读）

`themes/maps/` 与 `themes.json` 中的排版样式**派生自 [mdnice](https://editor.mdnice.com) 的公开主题**（经其公开 API 提取的逐元素计算样式）。版权归 mdnice 及各主题原作者所有，本仓库仅作技术复刻 / 复用，使用前请自行确认授权。详见 [NOTICE](./NOTICE)。

本仓库**不包含** mdnice 的示例文章内容（`themes/raw/`，即抓取缓存）。如需复现提取，请自行从 mdnice 公开 API 抓取后运行 `src/extract.mjs`。

## 许可

代码（`src/`、`tools/`、`skills/`）以 MIT 许可（见 [LICENSE](./LICENSE)）。主题样式数据的权利见上「主题来源与署名」。
