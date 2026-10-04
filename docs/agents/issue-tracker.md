# Issue tracker: Local Markdown

<!-- setup-project:tracker:start -->
本项目的 spec 和 ticket 以本地 Markdown 跟踪，保存在小写 `.scratch/` 下。

## 文件约定

- 每个功能一个目录：`.scratch/<feature-slug>/`。
- Spec：`.scratch/<feature-slug>/spec.md`。
- 实现 ticket：`.scratch/<feature-slug>/issues/<NN>-<slug>.md`，从 `01` 按依赖顺序编号，每个 ticket 一个文件。
- 每个 ticket 顶部有 `Status:` 行；状态词汇见 `triage-labels.md`。依赖写为 `Blocked by: NN, NN`。
- 评论和对话结论追加到 `## Comments`，保留既有正文和验收条件。

## 发布、读取与完成

技能要求“publish to the issue tracker”时，按上面的约定创建或更新本地文件；要求“fetch the relevant ticket”时，读取用户给出的路径或编号对应的文件。

实现 ticket 只有在验收条件满足、适用验证通过后才设为 `Status: done`。追加完成说明与验证结果，将实现、必要文档和 ticket 状态一起用中文 commit。Commit 失败时先修复并完成提交，再报告已完成。初始化配置不会自动完成已有 ticket。

查询待开发任务或 frontier 时排除 `done`、`wontfix` 和 wayfinder 的 `resolved`；已有依赖全部完成才可执行。实现依赖以 `done` 完成为准；`wontfix` 若仍被依赖，要重新评估依赖关系。

## Wayfinding operations

- Map：`.scratch/<effort>/map.md`，记录 Notes、Decisions-so-far 和 Fog。
- 子 ticket：`.scratch/<effort>/issues/NN-<slug>.md`，用 `Type: research/prototype/grilling/task` 区分。
- 调研、prototype、grilling 子 ticket 用 `Status: claimed` 和 `Status: resolved`。认领时先保存 `claimed`；解决后追加 `## Answer`，在 map 中记录结论和路径。
- `Type: task` 的实现子 ticket 完成后用 `Status: done`。该状态对 wayfinder 等价于已解决；计算阻塞和 frontier 时同时接受 `resolved` 与 `done`。既有 `resolved` 记录保留其含义。
- Frontier 只包含尚未完成、未认领且所有依赖已完成的子 ticket，优先选择编号最小者。

## 文件用途与 Git

Spec、map、编号 ticket 是长期任务记录，随代码提交。截图、录屏、日志、原始资料、临时脚本和中间文件存入被忽略的 `.agent-tmp/<task>/`。

`.scratch/` 默认只放行 `spec.md`、`map.md` 和 `issues/NN-*.md`；临时 Markdown 也属于中间文件。需要长期保留的调研结论和附件整理到项目正式文档目录；已有长期资料可在 `.gitignore` 添加精确例外，并记录用途。Ticket 或 map 中的长期结论应能独立理解，不依赖只有本机存在的临时截图。
<!-- setup-project:tracker:end -->
