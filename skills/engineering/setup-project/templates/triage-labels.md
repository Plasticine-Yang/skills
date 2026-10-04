# Triage Labels

<!-- setup-project:triage:start -->
默认五个 triage 状态沿用标准名称，增加本项目的完成终态 `done`。

| Role | 本地 Status | 含义 |
| --- | --- | --- |
| `needs-triage` | `needs-triage` | 待评估 |
| `needs-info` | `needs-info` | 等待补充信息 |
| `ready-for-agent` | `ready-for-agent` | 已明确，可由 agent 实现 |
| `ready-for-human` | `ready-for-human` | 需要人工实现 |
| `wontfix` | `wontfix` | 已决定不处理 |
| `done` | `done` | 实现完成，验收条件满足，适用验证通过 |

每个实现 ticket 有且只有一个 `Status:`。`bug`、`enhancement` 等分类及项目额外状态保留，与状态字段区分。

通常从 `needs-triage` 流转到 `needs-info`、`ready-for-agent`、`ready-for-human` 或 `wontfix`；补充信息后回到 `needs-triage`。实现完成后从可开发状态流转为 `done`，完成说明、验证和提交规则见 `issue-tracker.md`。

查询待开发任务时排除 `done`；重新打开已完成 ticket 需要用户明确要求或新缺陷的依据。Wayfinder 的调研类 `claimed` / `resolved` 保留原语义，其实现类 `task` 使用 `done`。
<!-- setup-project:triage:end -->
