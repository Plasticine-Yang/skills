# plasticine-skills

## 0.5.3

### Patch Changes

- [#16](https://github.com/Plasticine-Yang/skills/pull/16) [`419531f`](https://github.com/Plasticine-Yang/skills/commit/419531f43135fce3c5cb986f4d123c295cb829f5) Thanks [@Plasticine-Yang](https://github.com/Plasticine-Yang)! - 将 sync-html-renderer 移至仓库内部的 .agents/skills，移除公开安装入口，并保留本仓库的同步与发布维护能力。

## 0.5.2

### Patch Changes

- [#13](https://github.com/Plasticine-Yang/skills/pull/13) [`3aa0d4e`](https://github.com/Plasticine-Yang/skills/commit/3aa0d4edff3db11b34323f7b78dda45e43c16d66) Thanks [@Plasticine-Yang](https://github.com/Plasticine-Yang)! - 同步 HTML renderer 上游 v0.4.9，改善自动排版、局部修改和视频，支持日文与本地配音；新增 sync-html-renderer，一次调用完成后续上游同步、验证和 patch 发布。发布检查兼容较旧的 GitHub CLI。

## 0.5.1

### Patch Changes

- [#10](https://github.com/Plasticine-Yang/skills/pull/10) [`2114361`](https://github.com/Plasticine-Yang/skills/commit/211436137a8a474654279d607992ee2e96a18f2b) Thanks [@Plasticine-Yang](https://github.com/Plasticine-Yang)! - setup-project 统一使用小写 `.scratch/`，移除无依据的 `.Scratch/` 兼容规则，并同步清理 Git ignore 模板、脚手架和文档。

## 0.5.0

### Minor Changes

- [#8](https://github.com/Plasticine-Yang/skills/pull/8) [`a35f637`](https://github.com/Plasticine-Yang/skills/commit/a35f637e5b07b3cd64ddf0a60e43c6dbb3a1469c) Thanks [@Plasticine-Yang](https://github.com/Plasticine-Yang)! - 新增 Engineering 分组和仅手动触发的 setup-project skill：按个人预设配置 Matt Pocock 工程技能，合并保留已有项目内容，补齐 done、中文提交和 worktree 规则，并通过临时目录与任务记录白名单避免中间文件进入 Git。

## 0.4.0

### Minor Changes

- [#6](https://github.com/Plasticine-Yang/skills/pull/6) [`e9a457f`](https://github.com/Plasticine-Yang/skills/commit/e9a457f6f91e214192316d1b1d16f8ddd9e147d5) Thanks [@Plasticine-Yang](https://github.com/Plasticine-Yang)! - 新增 Collaboration 分组和可独立安装的 align-first skill。正文仅保留“你先理解我的想法，告诉我你会怎么做。”，并为 Claude Code 和 Codex 配置仅允许用户手动触发。

## 0.3.0

### Minor Changes

- [#4](https://github.com/Plasticine-Yang/skills/pull/4) [`1f3d37a`](https://github.com/Plasticine-Yang/skills/commit/1f3d37a02646f6372e40178e662f8bdcdf7a5fcb) Thanks [@Plasticine-Yang](https://github.com/Plasticine-Yang)! - Add answer-me-with-html-renderer as an independently installable Answer Me skill, adapted from QingYunA/answer-me-with-html. Preserve the existing interactive HTML skill and distribute the bundled Markdown renderer, examples, and upstream licenses. Keep generated HTML in the user's working directory under .answer-me/html unless they explicitly request another destination.

## 0.2.0

### Minor Changes

- [#2](https://github.com/Plasticine-Yang/skills/pull/2) [`a40b958`](https://github.com/Plasticine-Yang/skills/commit/a40b95865646f0fffdc818cd30e975c7de06228d) Thanks [@Plasticine-Yang](https://github.com/Plasticine-Yang)! - 新增四个可独立安装的中文 Answer me skills，分别提供文字、图解、交互 HTML 和带旁白的视频解释。文字版达到 ASD-STE100 的 80% 程度解释问题；图解、HTML 和视频文件分别输出到当前目录的 `.answer-me/diagrams`、`.answer-me/html` 和 `.answer-me/videos`。保留各 skill 的 `disable-model-invocation: true` 声明。

## 0.1.0

### Minor Changes

- [`ca0a654`](https://github.com/Plasticine-Yang/skills/commit/ca0a6544281eb9116af0f22db8f56658837918f1) - Import HumanLayer's build-iterated-agentic-loop and design-control-loop skills into the Agentic Loops installation group. Default generated skills to .agents/skills, clarify runner substitution, and repair example references while preserving the original workflows and iteration logic.
