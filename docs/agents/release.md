# 发布

所有 skills 与安装分组共用 Changesets 版本。发布 patch 时，从干净且已提交的工作区运行：

```bash
./scripts/project release patch --summary "面向用户的改动说明"
```

先加 `--dry-run` 可查看目标版本与流程，不修改 Git 或 GitHub。命令会运行项目与安装检查，补齐或复用本包的 patch Changeset，推送当前功能分支，创建或复用修正 PR，等待检查并合并，再处理 Changesets 版本 PR、Release workflow 和正式 Release。当前分支为 `main` 时先创建 `codex/release-v<version>`。

版本 PR 的 `check` 必须通过，并且所有版本元数据与目标版本一致才合并。命令用当前 `gh` 身份更新版本 PR 的中文标题，触发 Check 的 `pull_request.edited` 事件；标题已一致但缺少检查时，在保留原正文的基础上更新检查标记。通过 REST API 提交标题或正文，避开旧版 `gh pr edit` 查询的已废弃 Projects 字段。使用正常 PR 事件，无需关闭再打开 PR 或配置额外 token。其他分支保护条件仍由 GitHub 执行。

命令会输出创建或复用的 PR 链接。在 Codex 中执行时，将这些 PR 通过 `attach_artifact` 附加到当前 chat。

## 运行环境

`./scripts/project` 是非交互 shell 的 Node/npm 入口。安装了 fnm 时按 `.node-version` 选择 Node 22，首次缺失时安装；未安装 fnm 时使用 PATH 中已有的 Node 22+ 与 npm。CI 也从 `.node-version` 读取版本。

兼容尚不支持 `gh pr checks --json` 的旧版 GitHub CLI：该参数不可用时改读 `gh pr view --json statusCheckRollup`，同时检查 Actions 和传统状态。仍要求名为 `check` 的检查成功及分支保护允许合并；进行中、失败、取消或跳过均不能充当通过。

```bash
./scripts/project check
./scripts/project check-install
```

首次运行前用 `./scripts/project ci` 安装 package-lock.json 中的依赖，使用同一 Node/npm 入口。

## 失败与继续

每个阶段最多等待十分钟。检查失败、PR 提交变化、版本不一致、tag 指向其他提交或命令失败时停止；检查未出现不能当作成功。修复后回到原发布分支，提交修正，重跑同一命令。发布状态保存在 `.agent-tmp/release/v<version>/state.json`，用于复用已有 PR；保留该目录即可继续。已合并的 PR 不会再次合并。

发布成功的完成条件是正式 Release 可访问，且 tag 对应版本 PR 的合并提交。成功后直接返回链接，保留当前本地分支；不额外创建同步提交、推送 `main` 或修改已发布 tag。需要更新本地 `main` 时，切回 `main` 后只执行 `git pull --ff-only`。无法快进就保留状态并说明分歧。

Minor 与 major 发布继续按 README 的 Changesets 流程操作。
