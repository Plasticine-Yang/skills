<!-- setup-project:agent-skills:start -->
## Agent skills

### Issue tracker

本地 Markdown：spec、任务地图和编号 ticket 保存在 `.scratch/<feature>/`。创建、读取、完成 ticket 或查找可执行任务前，读取 `docs/agents/issue-tracker.md`。

### Triage labels

默认五个 triage 状态加终态 `done`。分类、流转或查询 ticket 前，读取 `docs/agents/triage-labels.md`。

### Domain docs

探索代码前读取 `docs/agents/domain.md`，按其中路径查阅相关 glossary 和 ADR。
<!-- setup-project:agent-skills:end -->

<!-- setup-project:workflow:start -->
## Project workflow

- 不为 UI 添加任何单元测试。UI 用浏览器、人工检查或适用的端到端测试验证；非 UI 逻辑按项目约定测试。保留并运行适用的已有检查。
- 开发 ticket 完成实现和适用验证后，将其更新为 `Status: done`，再把实现与 ticket 状态一起 commit。完成操作和依赖解锁遵循 `docs/agents/issue-tracker.md`。
- Commit 描述与正文使用中文；可保留 Conventional Commit 类型与 scope。开发完成后 commit。
- 使用 worktree 时，放在当前仓库根目录的 `.worktrees/<name>/`，确认目录被 Git ignore 后再创建。
- 截图、录屏、日志、原始下载、临时脚本和中间文件放在 `.agent-tmp/<task>/`；`.scratch/` 用于任务记录。需要长期保留的结论和附件整理进项目正式文档目录，修正引用。
- 提交时显式暂存本次交付文件，检查 `git diff --cached --name-status` 与暂存 diff，保留未关联的用户改动和暂存状态。
<!-- setup-project:workflow:end -->
