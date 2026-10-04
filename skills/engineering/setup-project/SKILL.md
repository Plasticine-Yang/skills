---
name: setup-project
description: 按个人预设初始化或更新项目的 Matt Pocock skills 配置，并保留已有项目内容。
disable-model-invocation: true
---

# Setup Project

仅在用户显式调用本 skill 时执行。一次调用即授权应用以下预设、补装缺失的工程 skills，并提交本次初始化变更。用户在当前会话给出的覆盖项优先。

## 预设

- Issue tracker 使用本地 Markdown；spec、map 和独立 ticket 保存在 `.scratch/<feature>/`。
- 保留默认五个 triage 状态，增加终态 `done`；实现 ticket 完成验证后流转为 `done`。
- 项目入口为 `AGENTS.md`，包括已有 `CLAUDE.md` 的项目。
- 不为 UI 添加任何单元测试。UI 用浏览器、人工检查或适用的端到端测试验证；非 UI 逻辑按项目约定测试。
- Commit 的描述与正文使用中文；可保留 Conventional Commit 的类型和 scope。
- 开发完成后 commit。本地 ticket 状态与实现一起提交。
- 使用 worktree 时放在当前仓库根目录的 `.worktrees/`，并将它加入 Git ignore。
- 截图、录屏、日志、下载的原始资料、临时脚本和中间文件放在 `.agent-tmp/<task>/`，并加入 Git ignore。`.scratch/` 只默认放行 spec、map 和编号 ticket。

这些偏好已经确定，直接应用。上游 `/setup-matt-pocock-skills` 的访谈和确认步骤由本流程替代。

## 1. 读取现状

先定位用户指定的项目；在仓库内调用时使用 Git 仓库根目录，在未初始化的项目中使用当前项目目录。读取根目录及目标文件所在目录的 agent 指令。

记录 `git status --short` 和已有暂存内容。读取 `AGENTS.md`、`CLAUDE.md`、`docs/agents/`、`.gitignore`、`GLOSSARY.md`、`GLOSSARY-MAP.md` 与已有 ADR 布局。检查 `.scratch/`、`.Scratch/` 的实际文件和 Git 跟踪状态。

运行随本 skill 分发的脚手架，路径从本 skill 的实际安装位置解析，不能假定安装在某个固定目录。需要 Node.js 22+。

```bash
node <skill-dir>/scripts/scaffold.mjs --repo <project-root>
```

默认只输出计划：缺失文件、需要人工语义合并的已有文件、项目内可发现的 skills 和待分类的已跟踪文件。脚手架的扫描不包含所有全局或插件 skills，结合当前 agent 的可用技能列表判断。若环境无法运行 Node，直接用文件工具按相同模板和合并规则完成配置；脚手架要求手动处理的符号链接先读取实际目标，再按项目归属处理。

完成条件：能区分缺失配置、与预设冲突的旧规则、项目新增内容和临时产物。

## 2. 补齐工程 skills

按 [安装规则](references/install.md) 检查并补装缺失的 Matt Pocock skills。已有项目安装、全局安装和插件提供的可用 skills 均可复用。保留已有版本和自定义内容。

新项目没有 Git 仓库时，先在项目根目录执行 `git init`，以便验证 ignore 和提交配置。

完成条件：必要 skills 可访问；若环境或网络阻止安装，继续完成独立的项目配置，在结束时报告具体缺失项。

## 3. 应用模板并合并

阅读 [合并规则](references/merge.md) 和全部 [模板说明](templates/README.md)，再执行：

```bash
node <skill-dir>/scripts/scaffold.mjs --repo <project-root> --write
```

脚手架只创建缺失文档，并首次追加 ignore 区块。**已有文档、已有管理区块由你按规则合并，脚手架不会替你更新它们。** 即使输出 `changed: []`，也继续检查已有规则是否满足预设。

对已有内容逐项合并：

1. 将 tracker、triage、domain 的入口统一放进 `AGENTS.md` 的 `## Agent skills`。已有同名章节就地更新，保留其中项目新增的条目。
2. 将开发、验证、提交和临时产物规则放进 `AGENTS.md` 的 `## Project workflow`；已有等价规则直接复用。详细操作通过文档指针读取。
3. 按模板更新 `docs/agents/issue-tracker.md` 和 `docs/agents/triage-labels.md`，默认状态采用标准名称，保留额外状态和分类。`done` 的完成条件、依赖解锁和查询排除规则必须一起写入。
4. 新建 `docs/agents/domain.md` 使用默认模板；已有 domain 文档保留路径和上下文划分。领域文件缺失时继续工作，由 domain-modeling 按需创建。
5. 更新 `.gitignore`，用 `git check-ignore --no-index` 验证实际结果。既有长期资料先分类，再增加精确的放行规则；详见合并规则。

预设与已有同一项规则冲突时，按本次预设更新。语义或用途无法判断时，只询问那个具体问题，同时继续不依赖答案的工作。

完成条件：七条原始偏好及临时文件规则均已生效，已有项目内容保留，入口和规则没有重复或相互矛盾。

## 4. 分类已有中间文件

先判断待分类文件是任务记录、长期资料还是临时产物，再处理。

- Spec、map、ticket 及项目明确保留的长期资料继续跟踪。
- 将确认的临时产物移到 `.agent-tmp/<task>/`，同时更新仍有价值的引用；对已跟踪临时文件逐个执行 `git rm --cached -- <path>`，保留本地文件。
- 用途未明确、含用户改动或已经暂存的文件保持原状，报告待处理路径。
- `.Scratch/` 使用同样的白名单保护；如需迁移到小写 `.scratch/`，先检查同名冲突，用 Git 迁移并修正引用。大小写不敏感文件系统需要中间目录名。

完成条件：本次提交只包含可交付的配置和已确认的清理变更。Ignore 不会移除历史提交中的文件，本流程只调整今后的跟踪。

## 5. 验证并提交

检查 diff，确认原有项目说明、额外标签、domain 布局、ignore 例外和未关联的用户改动均保留。尤其检查管理区块内部新增的项目内容。

用 `git check-ignore --no-index` 验证以下边界：spec、map、编号 ticket 可以提交；`.scratch/` 中的截图和临时 Markdown、`.agent-tmp/`、`.worktrees/` 被忽略；项目额外保留的文件可以提交。已有 ignore 冲突要修复后再验证。

再次运行脚手架，结合文档检查确认重跑不重复追加章节或改变已合并内容。

只显式暂存本次配置、安装文件和已确认的清理变更。查看 `git diff --cached --name-status` 及暂存 diff；若初始化前已有用户暂存内容，使用限定路径的提交保留其暂存状态。用中文 commit，例如 `chore: 初始化项目开发约定`。完全无变更时报告配置已满足预设。

报告实际变更、commit 和仍待处理的项目。调用本 skill 不会创建虚假的开发 ticket，也不会将已有未完成 ticket 批量标为 `done`。
