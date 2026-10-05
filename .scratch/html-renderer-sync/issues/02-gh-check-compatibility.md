Status: done
Type: task
Blocked by: 01

# 兼容当前 GitHub CLI 的发布检查

## 验收条件

- `gh 2.46.0` 不支持 `pr checks --json` 时可以读取 PR 的 Actions 和传统检查状态。
- 成功、等待、失败、取消和跳过保持既有合并条件；认证和网络错误不能被当作没有检查。
- 验证后中文提交，继续已创建的 PR #13 和 v0.5.2 发布状态。

## Comments

- 实际发布复现 `unknown flag: --json`。当前 gh 的 `pr view --json statusCheckRollup` 已返回 PR #13 的 `check`，状态为 `IN_PROGRESS`，因此不能提前合并。
- 验证完成：17 项仓库非 UI 行为测试通过；在实际 gh 2.46.0 上读取 PR #13 得到 `check: pass`。旧接口的等待、失败、取消、跳过和未知状态均不能授权合并，认证错误仍直接返回。
