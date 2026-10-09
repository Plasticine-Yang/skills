# Plasticine Skills

我维护的 coding-agent skills。当前提供三个分组：**Collaboration** 包含先理解想法、说明做法的 `align-first`；**Engineering** 包含初始化项目的 `setup-project`；**Answer Me** 只包含纯文字解释技能 `answer-me-with-text`。

## 安装

```bash
npx skills@latest add Plasticine-Yang/skills
```

交互菜单中可以整组选择 **Collaboration**、**Engineering** 或 **Answer Me**，也可以单独选择 skill。之后选择目标 agent 和安装范围；项目安装是默认选项，全局安装使用 `-g`。

只安装一个 skill：

```bash
npx skills@latest add Plasticine-Yang/skills --skill align-first
npx skills@latest add Plasticine-Yang/skills --skill setup-project
npx skills@latest add Plasticine-Yang/skills --skill answer-me-with-text
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

## Answer Me

根据 [Andrej Karpathy 关于理解模型输出的长帖](https://x.com/karpathy/status/2105819303471976479)编写。仅保留纯文字技能，内容使用中文并保持简短。

| 名称 | 安装标识 | 用途 |
| --- | --- | --- |
| [Answer me with text](skills/answer-me/answer-me-with-text/SKILL.md) | `answer-me-with-text` | 达到 ASD-STE100 的 80% 程度去解释用户的问题。 |

纯文字回答直接在聊天中输出。Skill 目录仅包含 `SKILL.md`，frontmatter 设置 `disable-model-invocation: true`。在支持该字段的 agent（例如 [Claude Code](https://code.claude.com/docs/en/skills)）中，仅允许用户手动触发，可使用 `/answer-me-with-text`。Codex 可通过选择 skill 或 `$answer-me-with-text` 显式调用；其隐式调用控制使用 `agents/openai.yaml` 的 `policy.allow_implicit_invocation`，本组当前未分发该配置文件，详见 [Codex 的调用策略](https://learn.chatgpt.com/docs/build-skills)。

当前分发的 skills 沿用仓库根目录的 [MIT 许可](LICENSE)。第三方模板与许可见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

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

`check` 检查主 skill 的 frontmatter、分组映射、许可、包内 references、仓库 workflow YAML 和版本一致性，并验证 setup-project 脚手架和发布逻辑。`check-install` 使用锁定版本的真实 skills CLI，在临时项目中分别安装各个 skills，核对全部分发文件，并从独立安装目录验证项目初始化脚手架，不会安装到全局目录。

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

License: [MIT](LICENSE)。
