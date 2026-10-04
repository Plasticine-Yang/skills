# 安装缺失的 Matt Pocock skills

先查当前 agent 可用技能、项目的 `.agents/skills/` 及 agent 专属目录。全局或插件提供的可访问 skill 同样算已安装。按名称复用已有 skill，即使它的版本或内容经过项目定制。

推荐工程技能及其共同依赖：

```text
ask-matt code-review codebase-design diagnosing-bugs domain-modeling
grill-with-docs grilling implement implement-spec improve-codebase-architecture
pr prototype research setup-matt-pocock-skills tdd to-spec to-tickets
triage wayfinder wizard writing-for-agents
```

只将缺失名称传给 CLI。在目标项目根目录运行，安装范围为该项目和当前 agent；Codex 用 `--agent codex`，Claude Code 用 `--agent claude-code`，其他 agent 使用 CLI 帮助中的标识。

```bash
npx --yes skills@1.7.0 add "mattpocock/skills#24fe0ef7737efae15c87225755e9f6f5965e4888" --skill <missing-names> --agent <current-agent> --copy --yes
```

源版本固定为模板核对过的 commit，CLI 版本固定为安装测试使用的版本。`--skill` 后跟以空格分开的实际缺失名称。已经全部可用时跳过安装；安装后重新读取可用文件与 lockfile，确认名称和来源。

复用现有安装，不将 `--all` 或更新命令用于补齐步骤，以免替换项目定制版本或安装到其他 agent。安装后继续本 skill 的模板合并流程，无需再启动上游 setup 的访谈。

安装需要 Git、Node.js/npm 和网络；环境缺少工具时使用当前 agent 可用的运行时。仍无法安装时说明缺失项及具体原因，同时完成不依赖安装的配置。
