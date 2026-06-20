# 更新日志

格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [未发布]

### 新增
- `themes/covers.json`：28 个主题的封面图 URL 入库，`themes.json` 无需 `themes/raw/` 即可完整重建。
- `bun src/bundle.mjs --check`：`themes.json` 漂移校验（比对 `maps` + `covers` 重建结果）。
- CI（GitHub Actions）：依赖安装 + 漂移校验 + 渲染冒烟测试。
- issue / PR 模板，引导贡献者重跑 `bundle --check`。

### 变更
- 仓库正名为 `rainman-jinshu`；`package.json` 去 `private`、补全元数据、移除未使用的 `markdown-it`。
- README 补「安装」「快速开始」「主题数据」小节，能力表与 SKILL 对齐。
- 校正「事实源」措辞：`themes/maps` + `themes/covers.json` 为源，`themes.json` 为产物，私有 web 以 vendoring 同步。

## [0.1.0]
- 锦书引擎首个版本：mdnice 风格主题渲染（28 款，逐元素内联样式）+ 公众号发草稿 + Claude Code skill。
