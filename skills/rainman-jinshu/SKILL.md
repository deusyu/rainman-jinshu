---
name: rainman-jinshu
description: 锦书 (jinshu) —— 把 Markdown 用 mdnice 风格主题排版成微信公众号样式，实时预览/一键复制，并可直接发到公众号草稿箱。Use when user says "jinshu", "锦书", "公众号排版", "Markdown 转公众号", "发公众号草稿", or wants WeChat Official Account typesetting with mdnice themes.
metadata:
  activation: 触发词 jinshu / 锦书。
  attribution: 主题样式提取自 mdnice 公开主题（themes derived from mdnice public themes）。
---

# 锦书 Jinshu

把 Markdown 渲染成微信公众号样式（28 款 mdnice 风格主题，逐元素内联样式、100% 对齐 mdnice 原版），发布走浏览器/CDP 路**复用** `baoyu-post-to-wechat`，不重写微信侧逻辑。

引擎与数据是唯一事实源，网页工具（私有 jinshu）与本 skill 共用同一份 `themes.json` / `themes/maps`。

## 能力

| 用法 | 命令 |
|------|------|
| 仅渲染（输出内联 HTML） | `bun src/render.mjs <themeId> <file.md>` |
| 渲染 + 发草稿箱 | `bun src/publish.mjs <file.md> <themeId> [--author 名]` |
| 渲染 + 群发提交 | `bun src/publish.mjs <file.md> <themeId> --submit` |
| 生成品牌封面(900×383/383×383) | `bun src/cover.mjs --title <标题> [--accent rgb] [--square]` |
| 复核主题保真度 | `node src/verify.mjs [themeId --detail]` |
| 重新抓取/打包主题 | `node src/extract.mjs && node src/bundle.mjs` |

themeId 见 `themes/maps/`（如 `3`=姹紫、`44`=Obsidian、`1`=橙心默认）。

## 发草稿流程（浏览器/CDP）

1. 首次：启一个带调试端口的 Chrome（`--remote-debugging-port=9222 --user-data-dir=~/.jinshu/chrome-profile`）打开 `mp.weixin.qq.com`，扫码登录公众号后台（session 持久化到该 profile）。
2. `bun src/publish.mjs article.md 3` → 锦书渲染成内联 HTML → `wechat-article.ts --html ... --cdp-port 9222` 连同一个已登录 Chrome，贴入编辑器、存草稿。
3. 在微信公众号后台终审/设置封面/群发（草稿需封面图 thumb）。

依赖：`bun`、Chrome、登录态的公众号后台、`baoyu-post-to-wechat` skill。

## 注意

- 暗色仅作用于工具外壳；文章正文用主题自身（浅色）内联样式，保真。
- 正文图片需上传到微信素材（`baoyu-post-to-wechat` 处理）；外链建议转底部引用。
- 主题样式提取自 mdnice 公开主题，开源请保留出处署名。
