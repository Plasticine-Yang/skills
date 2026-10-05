# 来源与维护

这是 `answer-me-with-html` 的模板渲染实现，安装名为 `answer-me-with-html-renderer`。本仓库原有的交互 HTML skill 保持独立。

- 上游：[QingYunA/answer-me-with-html](https://github.com/QingYunA/answer-me-with-html)。
- 固定 commit：`bac7c464ee85f7008931de38e9fcaac95fa5a007`。
- 上游 package 版本：`0.4.9`；本仓库的发行版本独立管理。
- 原路径：`skills/answer-me-with-html/`。
- `scripts/upstream/am.mjs` 与该 commit 的打包 CLI 字节一致。
- CLI SHA-256：`22aba64b660f3036cbb4986d88ee3eb0a6a83cd923af4d8f52315e853380e2b1`。
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

同步 `v0.4.9` 时引入 sheet 自动排版、patch 保留页面与视频设置、日文识别、本地 TTS 及修复，中文说明同步相应语义。该次同步未纳入发布后的 main 补丁。

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

在本仓库调用 `sync-html-renderer` 可完成上游正式版本同步、验证和 patch 发布；其 `prepare` / `apply` 辅助脚本复用缓存并核对原样文件，保留本地包装和说明。没有新版本时不创建空 release。以下是手动维护流程：

1. 在临时目录检出要引入的上游 commit，阅读 `SKILL.md` 和变更记录。
2. 从该 commit 复制已打包的 CLI 到 `scripts/upstream/am.mjs`。不要直接修改生成文件；需要改渲染器时，在上游源码中修改并重新构建。
3. 对照上游说明合并本地 `SKILL.md`，保留名称、目录、显式调用与更新渠道的适配。
4. 核对 lockfile 和全部打包依赖许可，更新本文件中的 commit、版本、摘要及根目录的 `THIRD_PARTY_NOTICES.md`。
5. 运行仓库 `check` 和 `check-install`，添加 changeset。安装检查会验证独立安装后的渲染、配置、局部修改和字幕视频。
