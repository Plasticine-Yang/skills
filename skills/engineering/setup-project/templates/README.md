# 模板用途

| 模板 | 项目中的目标 | 合并范围 |
| --- | --- | --- |
| [agents.md](agents.md) | `AGENTS.md` | Agent skills 入口、Project workflow 规则 |
| [issue-tracker.md](issue-tracker.md) | `docs/agents/issue-tracker.md` | 本地 tracker、完成状态、依赖与查询、文件用途 |
| [triage-labels.md](triage-labels.md) | `docs/agents/triage-labels.md` | 默认状态与 `done` 的定义 |
| [domain.md](domain.md) | `docs/agents/domain.md` | 新项目默认布局；已有项目保留原布局 |
| [gitignore.txt](gitignore.txt) | `.gitignore` | 临时目录、worktree、任务记录白名单 |

模板是预设的来源。缺失文件可按模板创建；已有文件按 [合并规则](../references/merge.md) 逐项更新。

`<!-- setup-project:... -->` 和 `.gitignore` 中的注释只用于定位。区块内部也可能有项目新增内容，更新时一起保留。本文档属于 skill 的参考资料，不复制到目标项目。
