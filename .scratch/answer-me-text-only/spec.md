# Answer Me 仅保留纯文字

用户最终确认 Answer Me 仅保留 `answer-me-with-text`。删除独立 HTML、图解、视频技能及 HTML Renderer，移除 Renderer 的内部同步技能、配套脚本、测试、分发声明、当前说明与输出目录约定。

已核查 `setup-project` 的说明、模板、脚本和安装规则，没有 Answer Me 或 `.answer-me` 相关约定；它的通用临时产物与任务记录规则保留。

前一版目录与随机后缀改动已合入 main，但 v0.5.5 尚未发布、版本 PR #21 尚未合并。本次清理替代该版本原先的交付范围，更新同一份 patch Changeset，并复用现有版本 PR 完成 v0.5.5。

同步卸载本机已安装的四个非文字 Answer Me 技能及其 agent 入口，保留纯文字技能和其他技能。
