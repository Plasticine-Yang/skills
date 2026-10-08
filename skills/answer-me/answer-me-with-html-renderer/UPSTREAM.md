# 来源与维护

这是 `answer-me-with-html` 的模板渲染实现，安装名为 `answer-me-with-html-renderer`。本仓库原有的交互 HTML skill 保持独立。

- 上游：[QingYunA/answer-me-with-html](https://github.com/QingYunA/answer-me-with-html)。
- 固定 commit：`e22e99f4fbfedef23d313ee1f13e0ad578c05278`。
- 上游 package 版本：`0.4.14`；本仓库的发行版本独立管理。
- 原路径：`skills/answer-me-with-html/`。
- `scripts/upstream/am.mjs` 与该 commit 的打包 CLI 字节一致。
- CLI SHA-256：`e983b5470d5cf6803be9fec0aa02b2331be94936c2c62585fe26bdf4618961c0`。
- `references/example.md` 和 `references/video-example.md` 分别来自上游 `examples/tcp.md` 和 `examples/video-tcp.md`，未修改。

## 本地适配

`SKILL.md` 调整名称、显式调用约定、输出位置和更新说明。保留内容稿、组件、写作检查、面板修改、主题与视频工作流。

`scripts/am.mjs` 是本地包装入口：

- HTML 默认输出到当前目录的 `.answer-me/html/`；视频播放页和 MP4 输出到 `.answer-me/videos/`。
- 默认文件名带时间戳和随机后缀；`-o` / `--out` 保留用户指定路径。
- 配置、状态与配音缓存使用当前目录的 `.answer-me/html-renderer/`；已有 `AM_HOME` 会被保留。
- 禁用上游后台版本检查与更新提示，防止使用上游安装名替换本移植版。
- `am clean` 仅处理 `AM_HOME` 数据目录，不处理这些默认成品目录。原版 `help` 中的默认路径以包装入口的说明为准。

未导入上游 marketplace、全局命令或 always-on 插件；如需高频输出，用户可用本实现的名字在规则中显式启用。

同步 `v0.4.14` 时引入 auto/paper/自定义主题、图表放大与平移缩放、本地图片内嵌、真实代码引用和红绿 diff、ask/面板评论/统一回复，以及简繁中文和更多语言的识别、标签、写作检查和旁白处理。patch 保留语言与页面、视频设置；普通 Markdown 对占位符及不安全原始 HTML 的处理同步上游。中文稿件指南说明新语法、私有代码分享提醒与页面回复的信任边界。

本地仍仅显式调用，不采纳上游主动触发策略；已删除上游移除的 `always` 配置说明，高频模式仍由用户规则启用。运行依赖及许可与前次同步相同；本次仅使用正式 tag，不纳入其后的 main 补丁。

## 运行

需要 Node.js 20+，不需要额外安装 npm 依赖。安装后，把以下路径替换为该 skill 的绝对路径：

```bash
node /path/to/answer-me-with-html-renderer/scripts/am.mjs render /path/to/answer-me-with-html-renderer/references/example.md --no-open
```

CLI 命令和组件语法可用 `help`、`help flow`、`help patch`、`help video` 查看。解释视频需要明确请求；MP4 导出另需 Node.js 22+、Chrome 和 ffmpeg。

## 许可

上游 MIT 许可原文保存在 [LICENSE](LICENSE)。打包运行时包含以下 MIT 依赖，版本取自固定 commit 的 `package-lock.json`，许可原文保存在 `licenses/`：

| 依赖 | 版本 | 许可文件 |
| --- | --- | --- |
| `@dagrejs/dagre` | `3.1.1` | [dagre.txt](licenses/dagre.txt) |
| `@dagrejs/graphlib` | `4.0.5` | [graphlib.txt](licenses/graphlib.txt) |
| `marked` | `18.0.14` | [marked.txt](licenses/marked.txt) |

## 更新上游

在本仓库调用内部维护 skill `.agents/skills/sync-html-renderer/SKILL.md` 可完成上游正式版本同步和 patch 发布，必要检查由仓库发布入口负责，不额外执行功能回归；其 `prepare` / `apply` 辅助脚本复用缓存并核对原样文件，保留本地包装和说明。没有新版本时不创建空 release。以下是手动维护流程：

1. 在临时目录检出要引入的上游 commit，阅读 `SKILL.md` 和变更记录。
2. 从该 commit 复制已打包的 CLI 到 `scripts/upstream/am.mjs`。不要直接修改生成文件；需要改渲染器时，在上游源码中修改并重新构建。
3. 对照上游说明合并本地 `SKILL.md`，保留名称、目录、显式调用与更新渠道的适配。
4. 核对 lockfile 和全部打包依赖许可，更新本文件中的 commit、版本、摘要及根目录的 `THIRD_PARTY_NOTICES.md`。
5. 运行仓库 `check` 和 `check-install`，添加 changeset。安装检查会验证独立安装后的渲染、配置、局部修改和字幕视频。
