# Plasticine Skills

我维护的 coding-agent skills。当前提供三个分组：**Agentic Loops** 包含两个从 HumanLayer 迁入的 loop skills；**Collaboration** 包含先理解想法、说明做法的 `align-first`；**Answer Me** 包含四个原创解释 skills，以及一个从 QingYunA 移植的 HTML 模板渲染实现。

## 安装

```bash
npx skills@latest add Plasticine-Yang/skills
```

交互菜单中可以整组选择 **Agentic Loops**、**Collaboration** 或 **Answer Me**，也可以单独选择 skill。之后选择目标 agent 和安装范围；项目安装是默认选项，全局安装使用 `-g`。

只安装一个 skill：

```bash
npx skills@latest add Plasticine-Yang/skills --skill build-iterated-agentic-loop
npx skills@latest add Plasticine-Yang/skills --skill design-control-loop
npx skills@latest add Plasticine-Yang/skills --skill align-first
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

根据 [Andrej Karpathy 关于理解模型输出的长帖](https://x.com/karpathy/status/2105819303471976479)编写。四个原创 skills 分别用文字、图解、交互网页和定制讲解视频降低理解成本；内容使用中文并保持简短，工具根据执行环境选择。另提供从 [QingYunA/answer-me-with-html](https://github.com/QingYunA/answer-me-with-html) 移植的模板渲染版：模型写扩展 Markdown，自带 CLI 生成 HTML。

| 名称 | 安装标识 | 用途 |
| --- | --- | --- |
| [Answer me with text](skills/answer-me/answer-me-with-text/SKILL.md) | `answer-me-with-text` | 达到 ASD-STE100 的 80% 程度去解释用户的问题。 |
| [Answer me with diagram](skills/answer-me/answer-me-with-diagram/SKILL.md) | `answer-me-with-diagram` | 用可直接查看的图解、图表或示意图解释结构、关系、过程或数据。 |
| [Answer me with HTML](skills/answer-me/answer-me-with-html/SKILL.md) | `answer-me-with-html` | 制作针对当前问题、可直接打开并探索的独立交互 HTML 页面。 |
| [Answer me with HTML Renderer](skills/answer-me/answer-me-with-html-renderer/SKILL.md) | `answer-me-with-html-renderer` | 写扩展 Markdown，由自带 CLI 生成带图表、主题和写作检查的单文件 HTML。 |
| [Answer me with video](skills/answer-me/answer-me-with-video/SKILL.md) | `answer-me-with-video` | 借鉴 3Blue1Brown 建立直觉的讲解方式，制作带旁白的定制视频。 |

图解、HTML 和视频落地成文件时，分别放在当前目录的 `.answer-me/diagrams`、`.answer-me/html` 和 `.answer-me/videos` 下。

HTML 的两种实现可独立安装：需要参数调整、情景切换等定制交互时用 `answer-me-with-html`；需要用现成图表和模板快速组织解释时用 `answer-me-with-html-renderer`。渲染版保留原有实现，自带打包运行时，生成页面需要 Node.js 20+，无需额外 `npm install`。还支持面板局部修改、写作检查，以及用户明确要求时的解释视频；MP4 导出需要 Node.js 22+、Chrome 和 ffmpeg。

渲染版的配置和缓存默认放在当前目录的 `.answer-me/html-renderer/`，可用 `AM_HOME` 修改。HTML 统一输出到 `.answer-me/html/`，使用 `-o` 命名时也遵守该目录约定；只有用户明确指定其他位置时才调整。视频输出到 `.answer-me/videos/`。调用 skill 内的 `scripts/am.mjs`，其包装入口会禁用上游的版本检查，更新跟随本仓库。来源、固定 commit 和维护方式见 [UPSTREAM.md](skills/answer-me/answer-me-with-html-renderer/UPSTREAM.md)。

四个原创 skill 目录仅包含 `SKILL.md`；渲染版还分发 CLI、示例和许可文件。五个 skill 的 frontmatter 均设置 `disable-model-invocation: true`。在支持该字段的 agent（例如 [Claude Code](https://code.claude.com/docs/en/skills)）中，仅允许用户手动触发，可使用 `/answer-me-with-text` 等命令。Codex 可通过选择 skill 或 `$answer-me-with-text` 显式调用；其隐式调用控制使用 `agents/openai.yaml` 的 `policy.allow_implicit_invocation`，本组当前未分发该配置文件，详见 [Codex 的调用策略](https://learn.chatgpt.com/docs/build-skills)。

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

需要 Node.js 22 或更高版本，使用 npm 10。

```bash
npm ci
npm run check
npm run check-install
```

`check` 检查主 skill 的 frontmatter、分组映射、许可、包内 references、workflow YAML 和版本一致性。`check-install` 使用锁定版本的真实 skills CLI，在临时项目中分别安装各个 skills，并核对全部分发文件；还会从独立安装目录验证 HTML 渲染、配置、面板修改与字幕视频，不会安装到全局目录。

首次迁移还可以运行：

```bash
npm run check-migration
```

它对照迁移快照核对 20 个上游文件：14 个字节一致，6 个只包含路径、注释和引用修改。后续有意修改 skill 后，这个历史快照检查会报告差异；普通 CI 不把 skills 永久锁定到初版。

## 发版

采用 Matt Pocock 的 Changesets 流程，所有 skills 和分组共用一个仓库版本。

1. 在功能分支修改 skill 或安装行为，运行检查。
2. 运行 `npm run changeset`，选择 `plasticine-skills`，记录升级类型和面向用户的改动说明。
3. 将代码和 changeset 一起提交 PR，检查通过后合并到 `main`。
4. Release workflow 自动创建或更新 **chore: version skills** PR，生成版本号和 CHANGELOG，并同步 marketplace、分组与 npm lockfile 的版本。
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
