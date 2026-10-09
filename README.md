# Plasticine Skills

我维护的 coding-agent skills。当前提供四个分组：**Agentic Loops** 包含两个从 HumanLayer 迁入的 loop skills；**Collaboration** 包含先理解想法、说明做法的 `align-first`；**Engineering** 包含初始化项目的 `setup-project`；**Answer Me** 包含纯文字解释，以及一个从 QingYunA 移植的 HTML 模板渲染实现。

## 安装

```bash
npx skills@latest add Plasticine-Yang/skills
```

交互菜单中可以整组选择 **Agentic Loops**、**Collaboration**、**Engineering** 或 **Answer Me**，也可以单独选择 skill。之后选择目标 agent 和安装范围；项目安装是默认选项，全局安装使用 `-g`。

只安装一个 skill：

```bash
npx skills@latest add Plasticine-Yang/skills --skill build-iterated-agentic-loop
npx skills@latest add Plasticine-Yang/skills --skill design-control-loop
npx skills@latest add Plasticine-Yang/skills --skill align-first
npx skills@latest add Plasticine-Yang/skills --skill setup-project
npx skills@latest add Plasticine-Yang/skills --skill answer-me-with-text
npx skills@latest add Plasticine-Yang/skills --skill answer-me-with-html-renderer
```

查看可安装列表：

```bash
npx skills@latest add Plasticine-Yang/skills --list
```

## Collaboration

| Skill | 用途 |
| --- | --- |
| [align-first](skills/collaboration/align-first/SKILL.md) | 你先理解我的想法，告诉我你会怎么做。 |

正文仅包含上面这一句话。仅允许用户手动触发：Claude Code 使用 `/align-first`，由 frontmatter 的 `disable-model-invocation: true` 控制；Codex 使用 `$align-first` 或选择 skill，由 `agents/openai.yaml` 的 `policy.allow_implicit_invocation: false` 控制。

## Engineering

| Skill | 用途 |
| --- | --- |
| [setup-project](skills/engineering/setup-project/SKILL.md) | 按个人预设初始化或更新 Matt Pocock skills 的项目配置，保留已有内容。 |

安装后，Codex 显式选择 skill 或输入 `$setup-project`；Claude Code 使用 `/setup-project`。仅允许用户手动触发，skill frontmatter 与 Codex 的 `agents/openai.yaml` 均关闭隐式调用。

一次调用会补齐缺失的 Matt Pocock 工程 skills，并应用固定预设：本地 Markdown tracker、默认五个 triage 状态加 `done`、`AGENTS.md` 入口、UI 不添加单测、中文 commit、开发完成后 commit，以及被 Git 忽略的 `.worktrees/`。

Spec、任务地图和编号 ticket 保存在 `.scratch/<feature>/` 并随代码提交；截图、日志、原始资料和中间文件放在被忽略的 `.agent-tmp/<task>/`。`.scratch/` 默认仅放行 spec、map 和编号 ticket，也兼容既有 `.Scratch/`。项目额外的长期资料按用途保留并添加精确例外，已跟踪的临时文件先分类再停止跟踪，保留本地文件。

模板随 skill 分发。脚手架需要 Node.js 22+，默认只输出计划，加 `--write` 后创建缺失文档并首次追加 ignore 区块；已有文件由 agent 按章节和规则合并，保留管理区块内外的项目新增内容。新项目、已安装项目和已 setup 的项目使用同一流程，重复调用不会重复追加章节。

补装只针对当前项目和当前 agent 的缺失技能，复用已有版本和定制内容。安装源与 CLI 固定到经过核对的版本；来源和维护方式见 [UPSTREAM.md](skills/engineering/setup-project/UPSTREAM.md)。初始化结束后显式暂存本次变更并用中文提交，已有用户改动和暂存内容保留。

## Agentic Loops

| Skill | 用途 |
| --- | --- |
| [build-iterated-agentic-loop](skills/agentic-loops/build-iterated-agentic-loop/SKILL.md) | 把明确的重复任务搭建成仓库内 skill、GitHub Actions workflow、记忆文件和 PR 反馈迭代机制。 |
| [design-control-loop](skills/agentic-loops/design-control-loop/SKILL.md) | 从目标出发，通过访谈设计 sensor、controller、actuator 与反馈机制，先本地验证，再接入持续运行的 workflow。 |

安装后，在 agent 中要求使用对应 skill，例如：

> 使用 design-control-loop，帮我设计并搭建一个逐步消除旧 API 调用的循环。

支持 slash commands 的 agent 也可以使用 `/design-control-loop` 或 `/build-iterated-agentic-loop`。

这两个 skills 用于**设计和生成自动化**；安装本身不会创建或启动定时任务。生成的 skill 默认放在目标仓库的 `.agents/skills/`。是否自动发现这个目录由所选 agent 决定；需要时通过 prompt 显式指向该 `SKILL.md`，或使用该 agent 的安装配置。

原文已经提供 Claude Code、Codex、OpenCode、CodeLayer 的 runner 参考。workflow 中的 CodeLayer 命令是示例，生成实际 workflow 时需要按所选 agent 替换认证、安装、调用和结果提取，普通运行与 `/iterate` 两条路径都要处理。

## Answer Me

根据 [Andrej Karpathy 关于理解模型输出的长帖](https://x.com/karpathy/status/2105819303471976479)编写。只保留纯文字与 HTML 模板渲染两个 skills；内容使用中文并保持简短。模板渲染版从 [QingYunA/answer-me-with-html](https://github.com/QingYunA/answer-me-with-html) 移植：模型写扩展 Markdown，自带 CLI 生成带图表的 HTML，并支持按需解释视频。

| 名称 | 安装标识 | 用途 |
| --- | --- | --- |
| [Answer me with text](skills/answer-me/answer-me-with-text/SKILL.md) | `answer-me-with-text` | 达到 ASD-STE100 的 80% 程度去解释用户的问题。 |
| [Answer me with HTML Renderer](skills/answer-me/answer-me-with-html-renderer/SKILL.md) | `answer-me-with-html-renderer` | 写扩展 Markdown，由自带 CLI 生成带图表、主题和写作检查的单文件 HTML。 |

HTML 和视频成品分别放在用户主目录的 `~/.answer-me/html/` 和 `~/.answer-me/videos/` 下。新产物采用 `<名称>-${hash}.<扩展名>`，hash 为每次新生成的 12 位随机十六进制串；同一视频的播放页和 MP4 共用后缀，局部修改保留原路径。

需要用现成图表和模板组织解释时用 `answer-me-with-html-renderer`。渲染版自带上游 v0.4.14 打包运行时，生成页面需要 Node.js 20+，无需额外 `npm install`。支持自动主题、paper 与自定义主题、图表放大缩放、本地图片内嵌、真实代码引用和红绿 diff，以及页面提问、面板评论和统一回复。语言识别与写作检查覆盖简繁中文和更多文字系统；局部修改保留页面、语言与视频设置。用户明确要求时可生成解释视频，配音可使用本地兼容语音服务。MP4 导出需要 Node.js 22+、Chrome 和 ffmpeg。

渲染版的配置和缓存默认放在 `~/.answer-me/html-renderer/`，可用 `AM_HOME` 修改。使用 `-o` / `--out` 选择名称时也遵守成品目录约定；只有用户明确指定其他位置时才调整。包装入口保留指定目录，自动在名称后追加 hash，以 CLI 的 `✓` 输出为实际路径。生成时仍使用项目工作目录读取引用文件，修改 `AM_HOME` 不改变默认成品目录。调用 skill 内的 `scripts/am.mjs`，其包装入口会禁用上游的版本检查，更新跟随本仓库。来源、固定 commit 和维护方式见 [UPSTREAM.md](skills/answer-me/answer-me-with-html-renderer/UPSTREAM.md)。

纯文字 skill 目录仅包含 `SKILL.md`；渲染版还分发 CLI、示例和许可文件。两个 skill 的 frontmatter 均设置 `disable-model-invocation: true`。在支持该字段的 agent（例如 [Claude Code](https://code.claude.com/docs/en/skills)）中，仅允许用户手动触发，可使用 `/answer-me-with-text` 等命令。Codex 可通过选择 skill 或 `$answer-me-with-text` 显式调用；其隐式调用控制使用 `agents/openai.yaml` 的 `policy.allow_implicit_invocation`，本组当前未分发该配置文件，详见 [Codex 的调用策略](https://learn.chatgpt.com/docs/build-skills)。

原创 skills 沿用仓库根目录的 [MIT 许可](LICENSE)。从 HumanLayer 和 QingYunA 迁入的 skills 保留各自的 `LICENSE`；HTML 渲染版同时保留打包依赖的许可。

## 版本与更新

直接安装仓库时获取默认分支的当前内容。GitHub Release 或 manifest 中的版本号不会改变这一点。

跟随默认分支安装的 skills 可以使用：

```bash
npx skills@latest update
```

首个版本 tag 发布后，可以固定安装：

```bash
npx skills@latest add "Plasticine-Yang/skills#v0.1.0"
```

按 tag 安装时，更新仍跟随该 tag；升级或回退请重新运行带目标 tag 的安装命令，并选择要替换的 skill。已发布 tag 不移动。

仓库初始化版本为 `0.0.0`，首次导入附带 minor changeset，首个版本 PR 将生成 `0.1.0`；上面的固定版本命令需要等该 tag 发布后才能使用。

## 开发与检查

仓库内部维护技能位于 `.agents/skills/`。[sync-html-renderer](.agents/skills/sync-html-renderer/SKILL.md) 用于同步渲染器上游正式版本，保留本地适配并发布 patch。同步后直接进入发布入口，必要检查由发布入口负责，不额外执行功能回归。它仅在本仓库显式调用；`metadata.internal: true` 使 skills CLI 默认安装列表排除该技能，marketplace 也不声明它。

需要 Node.js 22 或更高版本，使用 npm 10。

```bash
npm ci
npm run check
npm run check-install
```

`check` 检查主 skill 的 frontmatter、分组映射、许可、包内 references、workflow YAML 和版本一致性，并验证 setup-project 脚手架、渲染器同步保护和发布逻辑。`check-install` 使用锁定版本的真实 skills CLI，在临时项目中分别安装各个 skills，并核对全部分发文件；还会从独立安装目录验证项目初始化脚手架、HTML 渲染、配置、面板修改与无声视频设置，不会安装到全局目录。

首次迁移还可以运行：

```bash
npm run check-migration
```

它对照迁移快照核对 20 个上游文件：14 个字节一致，6 个只包含路径、注释和引用修改。后续有意修改 skill 后，这个历史快照检查会报告差异；普通 CI 不把 skills 永久锁定到初版。

## 发版

采用 Matt Pocock 的 Changesets 流程，所有 skills 和分组共用一个仓库版本。

Patch 发布可以在已提交且干净的工作区使用统一命令：

```bash
./scripts/project release patch --summary "面向用户的改动说明"
```

加 `--dry-run` 可先查看计划。命令完成 Changeset、两轮 PR、检查、合并和 Release 确认；失败后重跑会复用已有 PR。版本 PR 通过编辑事件触发检查，不需要关闭再打开。Node/npm 通过同一入口和 `.node-version` 选择；发布后保留本地分支，不额外推送 `main`。操作细节见 [发布说明](docs/agents/release.md)。

Minor、major 或手动发布沿用以下流程：

1. 在功能分支修改 skill 或安装行为，运行检查。
2. 运行 `npm run changeset`，选择 `plasticine-skills`，记录升级类型和面向用户的改动说明。
3. 将代码和 changeset 一起提交 PR，检查通过后合并到 `main`。
4. Release workflow 自动创建或更新 **chore: 更新技能版本** PR，生成版本号和 CHANGELOG，并同步 marketplace、分组与 npm lockfile 的版本。
5. 检查并合并版本 PR；workflow 执行 `npx changeset tag` 发布版本 tag。

仓库使用 `private: true` 和 Changesets 的 `privatePackages.version/tag` 配置，只进行版本管理和 Git tag 发布，不发布 npm 包。发版过程不会改写 skill 内容。

首次启用时，在 GitHub **Settings → Actions → General → Workflow permissions** 中允许 **Allow GitHub Actions to create and approve pull requests**，让 Changesets bot 可以创建版本 PR。workflow 自身声明了所需的 contents/pull-requests 权限。若仓库有分支保护或额外规则，按规则 review 版本 PR。

`main` 上的内容一旦合并，仓库级安装即可获取；版本 PR 和 tag 用于记录、固定版本与回退，不作为默认分支内容的分发闸门。

## 来源与修改范围

HumanLayer 上游固定为 commit `ca7c8088db69e315a8b2deea43820270457f8f3c`。

- 默认生成路径统一为 `.agents/skills/`，保留探索已有 `.claude/skills` 的要求。
- workflow 只增加 runner 替换注释，执行结构不变。
- 修正示例中的失效引用。
- 原流程、访谈、完成条件、控制论、记忆规则、runner 模板、迭代脚本与 PR 标记保留。

逐文件修改见 [迁移 patch](docs/humanlayer-migration.patch)，来源与许可见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。上游示例保留为示例，使用时按目标仓库调整。

License: [MIT](LICENSE)。
