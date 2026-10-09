# 01：移除 Renderer 并仅分发纯文字技能

Status: done
Type: task

## 范围

删除剩余 Renderer 与内部同步能力，清理相关分发、运行、检查和说明引用，更新既有 patch Changeset。

## 验收条件

- Answer Me 分组只含 `answer-me-with-text`，四个非文字技能均不再被安装器发现。
- Renderer 与 sync-html-renderer 的文件、专属测试、包脚本和检查分支全部移除。
- 当前 README、安装锁文件、来源声明、ignore 不再要求或引用 `.answer-me` 输出目录。
- `setup-project` 及其他无关技能和适用检查保留。
- `./scripts/project check` 与 `./scripts/project check-install` 通过，完成状态随实现中文提交。
- 本机只保留纯文字 Answer Me 安装；提交后通过仓库入口完成 v0.5.5 patch，按正式 Release 与版本 PR 合并提交的 tag 一致性确认发布。

## Comments

用户在版本 PR 未合并时调整方案，已停止旧自动发布流程；最终方案与清理范围已再次确认。

完成：删除 Renderer 的整个分发目录、内部同步技能和专属测试，移除包脚本及检查入口，更新分组、安装锁文件、README、来源声明和 ignore。既有 Changeset 已重写为最终纯文字范围。历史任务与调研记录保留，旧方案标记为被替代，调研链接固定到 v0.5.4。

验证：`./scripts/project check` 通过（5 个公开技能、13 项发布测试与版本检查），`./scripts/project check-install` 通过（逐个独立安装、排除已删除技能、setup-project 全部既有检查）。setup-project 文件 diff 为空，当前技能与运行配置不再引用 `.answer-me`。

本机沿原 skills CLI 渠道全局卸载四个非文字 Answer Me 技能及各 agent 入口；安装列表仅剩 text，text 内容与仓库一致，其他技能的锁记录未改变。旧安装副本已保存在本机忽略的临时目录。实现与完成状态一起中文提交，接着复用尚未合并的版本 PR #21 发布 v0.5.5。
