# 01：移除 Agentic Loops

Status: done
Type: task

## 验收条件

- 删除两个 skills 及其 references、独立 LICENSE 和空安装分组。
- README、第三方说明、npm scripts 和专用迁移资料不再指向已删除文件。
- 项目检查与真实 skills CLI 的独立安装检查通过，安装列表不再包含被移除的 skills 或分组。
- 实现与完成状态一起提交，准备通过统一发布入口发布 v0.5.6。

## Comments

用户已授权删除全部 Agentic Loops skills 并发布 patch release。当前 main 与 origin/main 一致，工作区和暂存区干净，最新正式版本为 v0.5.5。

实现完成：删除两个 skills 和全部 references、独立 LICENSE、安装分组、迁移快照与检查脚本；更新 README、第三方说明和安装检查。历史 CHANGELOG 与根目录许可保留。

验证：`./scripts/project check` 通过（3 个 skills、3 个分组、13 项发布测试与版本检查）；`./scripts/project check-install` 通过（三个 skills 的独立安装内容一致，已移除 skills 与分组均未出现在安装列表）。`git diff --check` 通过。提交后使用统一发布入口发布 v0.5.6。
