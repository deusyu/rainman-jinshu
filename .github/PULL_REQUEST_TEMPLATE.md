## 改动说明

<!-- 简述这次改动做了什么、为什么 -->

## 自检清单

- [ ] 若改了 `themes/maps/` 或 `themes/covers.json`，已重跑 `bun src/bundle.mjs` 并提交更新后的 `themes.json`
- [ ] `bun src/bundle.mjs --check` 通过（themes.json 无漂移）
- [ ] 若改了渲染逻辑，已用 `bun src/render.mjs <themeId> sample.md` 自测过输出
