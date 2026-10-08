# 04：将同步技能收归仓库内部

Status: done
Type: task
Blocked by: 03

## 问题

`sync-html-renderer` 只服务于本仓库维护，应放在 `.agents/skills/`，公开分发仅包含供其他项目使用的技能。

## 验收条件

- 技能、Codex 配置和同步脚本移至 `.agents/skills/sync-html-renderer/`，保留显式调用和同步行为。
- marketplace 和公开安装说明移除该技能；真实 skills CLI 的安装列表排除它。
- 修正测试和维护说明中的路径，项目检查和独立安装检查通过。

## Comments

原 spec 中“新 skill 可安装”的验收要求由本 ticket 修正为本仓库可显式调用，公开安装列表排除。

完成：技能、Codex 配置和同步脚本已整体迁移，添加 `metadata.internal: true`；移除 marketplace 声明和 README 安装入口，修正维护文档与测试路径，添加 patch Changeset。

验证：`./scripts/project check` 通过（9 个公开 skills、4 个分组、18 个非 UI 测试）；`./scripts/project check-install` 通过，真实 CLI 列表排除内部技能，全部 9 个公开技能独立安装、初始化与渲染检查通过。`git diff --check` 通过。
