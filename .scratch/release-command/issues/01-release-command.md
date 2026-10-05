Status: done

# 简化 patch 发布流程

## 目标

将本次发布复盘的改进落实为可复用命令，保留 Changesets 的两个 PR 和现有检查。

## 验收条件

- 一个命令完成 patch Changeset、修正 PR、版本 PR 和 GitHub Release 确认。
- 版本 PR 通过正常 PR 事件触发检查，避免关闭再打开或绕过分支保护。
- 检查必须通过且提交匹配才合并；失败或超时停止，重跑复用已有 PR。
- Node/npm 有统一的项目入口。
- 发布后保留本地分支，不额外合并、推送 main 或改写已发布 tag。
- 自动化检查覆盖检查失败、提交变化及成功发布；现有项目和安装检查通过。

## Comments

- 新增 `./scripts/project release patch --summary "说明"`，自动处理 Changeset、两轮 PR、检查和 Release 确认；状态记录支持继续，同一提交复用已通过的本地检查。
- Check 响应 `pull_request.edited`，命令通过当前 gh 身份更新版本 PR，替代关闭再打开。CI 与本地统一读取 `.node-version`。
- 发布后保留当前分支，未添加同步 main 或修改已发布 tag 的步骤。
- 验证：`./scripts/project check`、`./scripts/project check-install`、`bash -n scripts/project` 和 `git diff --check` 通过。11 项发布检查包含真实隔离 Git 仓库中的 dry-run、失败后继续、main 与远端保留验证。
