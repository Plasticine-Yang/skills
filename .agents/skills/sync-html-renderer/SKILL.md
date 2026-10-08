---
name: sync-html-renderer
description: 同步 HTML renderer 的上游正式版本，保留本地适配，验证并发布本仓库的 patch release。
disable-model-invocation: true
metadata:
  internal: true
---

# 同步并发布 HTML renderer

这是 `Plasticine-Yang/skills` 仓库的内部维护 skill，位于 `.agents/skills/sync-html-renderer/`。用户调用本 skill，即授权同步 `QingYunA/answer-me-with-html`、验证、中文提交和仓库 patch 发布；用户附加的版本或范围限制优先。

## 定位与准备

定位此仓库已有的 checkout，优先当前目录，其次当前环境的项目列表；后续命令均在仓库根目录运行。读取 `AGENTS.md`、`docs/agents/release.md` 和渲染器的 `UPSTREAM.md`。已有未完成发布时回到原分支继续；开始新同步时先核对 `origin/main`，从最新 main 创建 `codex/` 功能分支，处理上次发布后保留分支的旧版本。保留无关用户改动，必要时按仓库规则使用隔离 worktree。

`sync` 指本 skill 的 `scripts/sync-upstream.mjs`，使用实际绝对路径。Node.js 22+、Git 和已登录的 `gh` 是现有发布流程需要的环境。依赖未安装时运行 `./scripts/project ci`。

```bash
node /path/to/sync-html-renderer/scripts/sync-upstream.mjs prepare --repo /path/to/skills
```

默认读取上游最新正式 release；用户指定稳定 tag 时加 `--ref vX.Y.Z`。脚本复用被忽略的 `.agent-tmp/html-renderer-update/upstream` 缓存，生成 `sync-plan.json`、提交记录、skill 差异和依赖差异。读取输出的这些材料即可完成常规同步，无需重做整仓调研。

`unchanged: true` 表示上游 commit 和本地记录一致：若没有本次同步的待发布提交或发布状态，报告已是最新并结束。若上次已提交同步但尚未发完 release，继续原发布分支与原 summary。

## 同步与验证

1. 根据差异判断实际行为变化，合并本地中文 `SKILL.md`、README 功能摘要及 `UPSTREAM.md` 的本地适配说明。保留本地 skill 名称、显式调用、包装入口、输出与配置隔离、`AM_HOME` 覆盖和本仓库更新渠道。写稿说明须与新运行时一致。
2. 运行同一脚本的 `apply --repo /path/to/skills`。它只更新原样 CLI、未定制示例、MIT 许可及来源 commit/版本/摘要，保留包装和说明。校验失败先解决具体差异：本地定制用三方合并；运行依赖变化时按 lockfile 核对全部打包依赖、许可文件和 `UPSTREAM.md` 许可表，完成手动移植。脚本不会执行上游安装器。
3. 添加面向用户的 patch Changeset。运行 `./scripts/project check` 和 `./scripts/project check-install`；新增非 UI 同步逻辑按仓库约定验证。对本次可见变化做浏览器检查，布局变化至少检查宽图表、暗色、窄屏与打印；视频相关变化验证旧页面 patch 和字幕视频。产物放 `.agent-tmp/`。
4. 按仓库 tracker 规则记录完成；显式暂存本次交付、检查暂存 diff 并用中文 commit，得到可发布的干净工作区。

## 发布与完成

```bash
./scripts/project release patch --summary "同步 HTML renderer 上游 vX.Y.Z，说明实际变化"
```

复用仓库发布入口处理 Changeset、修正 PR、检查、合并、版本 PR 和 Release。命令输出的每个 PR 都在 Codex 中通过 `attach_artifact` 附加到当前 chat。失败时根据日志修复，回到原分支，使用原 summary 重跑；无需重新同步已固定的上游版本。

完成条件以仓库发布文档为准：正式 Release 可访问，tag 对应版本 PR 的合并提交。将当前环境已有的渲染器安装副本沿原渠道和范围更新；仅同步本 skill 涉及的副本，用本仓库的已发布 tag 安装。最后给出本次上游版本、主要变化和 Release 链接。保留发布分支；不能用上游原 skill 的安装器替换本移植版。
