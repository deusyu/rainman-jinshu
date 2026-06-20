# 锦书 Jinshu · 引擎与 skill

> 让每篇公众号，都像一封锦书。

[![CI](https://github.com/deusyu/rainman-jinshu/actions/workflows/ci.yml/badge.svg)](https://github.com/deusyu/rainman-jinshu/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

把 Markdown 用 mdnice 风格主题排版成**微信公众号样式**，逐元素内联样式、与 mdnice 原版 100% 对齐；并可经 Claude Code 直接发到公众号草稿箱。

这是**开源引擎 + skill**部分。品牌站点（锦书 web）单独私有。

## 安装

前置：[Bun](https://bun.sh)。发草稿另需 Chrome、已登录的公众号后台，以及 [`baoyu-post-to-wechat`](https://github.com/JimLiu/baoyu-skills) skill。

```bash
bun install
```

## 快速开始

```bash
# 渲染 sample.md（主题 3 = 姹紫），输出内联 HTML 到 out.html
bun src/render.mjs 3 sample.md > out.html
```

发草稿见下文「作为 Claude Code skill」。

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
| （可选）重抓主题 | `bun src/extract.mjs`（需先抓取 `themes/raw/`，见下） |

themeId 见 `themes/maps/`（共 28 款，如 `3`=姹紫、`44`=Obsidian、`1`=橙心默认）。

## 作为 Claude Code skill

`skills/rainman-jinshu/SKILL.md`，触发词 **jinshu / 锦书 / 公众号排版**。发草稿走浏览器/CDP，**复用** [`baoyu-post-to-wechat`](https://github.com/JimLiu/baoyu-skills) skill（依赖其脚本，不重写微信侧逻辑）。

`src/publish.mjs` 会自动探测 `baoyu-post-to-wechat`（`~/.claude` 下的插件市场或已装 skill）；探测不到时，设环境变量 `BAOYU_POST_TO_WECHAT` 指向其 `scripts/wechat-article.ts` 或 skill 目录。

## 主题数据

`themes/maps/`（28 款逐元素样式映射）与 `themes/covers.json`（各主题封面图 URL）是**事实源**；`themes.json` 由 `bun src/bundle.mjs` 打包二者生成并入库，`bun src/bundle.mjs --check` 可校验其未漂移。锦书 web（私有）以同步副本方式（vendoring）复用本仓 `themes.json`，并非各自维护。

> `themes/raw/`（mdnice 抓取缓存）不入库；封面 URL 已抽出至 `themes/covers.json`，因此无需 raw 也能完整重建 `themes.json`。

## 主题来源与署名（请阅读）

`themes/maps/` 与 `themes.json` 中的排版样式**派生自 [mdnice](https://editor.mdnice.com) 的公开主题**（经其公开 API 提取的逐元素计算样式）。版权归 mdnice 及各主题原作者所有，本仓库仅作技术复刻/复用，使用前请自行确认授权。详见 [NOTICE](./NOTICE)。

本仓库**不包含** mdnice 的示例文章内容（`themes/raw/`，即抓取缓存）。如需复现提取，请自行从 mdnice 公开 API 抓取后运行 `src/extract.mjs`。

## 许可

代码（`src/`、`tools/`、`skills/`）以 MIT 许可（见 [LICENSE](./LICENSE)）。主题样式数据的权利见上「主题来源与署名」。
