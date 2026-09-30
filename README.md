# Plasticine Skills

我维护的 coding-agent skills。当前提供 **Agentic Loops** 分组，包含两个从 HumanLayer 迁入、采用 `.agents/skills/` 默认路径的 loop skills。

## 安装

```bash
npx skills@latest add Plasticine-Yang/skills
```

交互菜单中可以整组选择 **Agentic Loops**，也可以单独选择 skill。之后选择目标 agent 和安装范围；项目安装是默认选项，全局安装使用 `-g`。

只安装一个 skill：

```bash
npx skills@latest add Plasticine-Yang/skills --skill build-iterated-agentic-loop
npx skills@latest add Plasticine-Yang/skills --skill design-control-loop
```

查看可安装列表：

```bash
npx skills@latest add Plasticine-Yang/skills --list
```

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

`check` 检查主 skill 的 frontmatter、分组映射、包内 references、workflow YAML 和版本一致性。`check-install` 使用锁定版本的真实 skills CLI，在临时项目中分别安装两个 skills，并核对全部文件和许可；不会安装到全局目录。

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
