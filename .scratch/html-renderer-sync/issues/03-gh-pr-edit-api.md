# 03：通过 REST API 编辑版本 PR

Status: done
Type: task
Blocked by: 02

## 问题

发布 v0.5.2 时，本机 gh 2.46.0 的 pr edit 查询 GitHub 已废弃的 Projects classic 字段，无法更新版本 PR 并触发检查。

## 验收条件

- 使用结构化 JSON 的 REST PATCH 编辑目标 PR，保留现有正文和检查标记行为。
- 已有检查时不重复编辑；编辑失败时不继续合并。
- 本地发布测试和项目检查通过；不绕过 CI 或分支保护。

## Comments

实现完成：REST PATCH 接收 JSON 文件，标题与正文分支共用路径；正文保留原内容并替换旧标记。测试覆盖字段传输、已有检查时不编辑、鉴权失败传播。`./scripts/project check` 通过（18 个非 UI 测试）。
