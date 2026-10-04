# 来源与维护

本 skill 的预设、流程、合并规则和脚手架为本仓库实现。

本地 issue tracker 的目录结构、默认 triage 角色、domain 消费规则和 wayfinder 操作改编自 [Matt Pocock skills](https://github.com/mattpocock/skills/tree/24fe0ef7737efae15c87225755e9f6f5965e4888/skills/engineering/setup-matt-pocock-skills)，固定 commit `24fe0ef7737efae15c87225755e9f6f5965e4888`。对应 MIT 许可随 skill 分发在 [licenses/mattpocock-skills.txt](licenses/mattpocock-skills.txt)。本仓库的原创部分沿用根目录 MIT 许可。

维护模板时，核对上游 tracker 的路径、状态语义和各技能的消费者行为。更新安装源 commit 时，同时核对 `references/install.md` 的 skill 名称列表，并运行仓库的 `npm run check` 与 `npm run check-install`。

手动调用配置使用 `disable-model-invocation: true`，并设置 `agents/openai.yaml` 的 `policy.allow_implicit_invocation: false`；Codex 的配置语义见 [OpenAI 官方文档](https://learn.chatgpt.com/docs/build-skills)。
