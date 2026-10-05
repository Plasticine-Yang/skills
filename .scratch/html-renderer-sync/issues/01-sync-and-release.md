Status: done
Type: task

# 同步渲染器并封装可发布的 skill

## 验收条件

- 固定上游 v0.4.9，更新原样 CLI、中文说明与来源信息，保留本地适配。
- 新增 `sync-html-renderer` 和可重复执行的同步辅助脚本，覆盖无更新、保护本地改动及来源一致性。
- 仓库检查、独立安装及浏览器验证通过；UI 不新增单测。
- 实现和本 ticket 状态一起用中文提交，交付可运行现有 patch 发布入口的干净工作区。实际发布及 Release 确认按 spec 继续完成。

## Comments

- 用户已授权本次同步、发布，以及把相同行为封装为后续可调用的 skill。
- 实现验收完成：已固定 v0.4.9 原样 CLI，保留本地包装、目录和显式调用；新增可独立安装的同步 skill 和缓存辅助脚本。
- `./scripts/project check` 通过（16 个非 UI 行为测试）；`check-install` 通过十个 skill 的独立安装，验证配置、输出、patch 和无声视频保留设置。实际 prepare/apply 同步及重复无更新路径通过。
- 浏览器核对桌面宽表格/流程图、暗色、390px 窄屏及单列重排；无控制台错误。打印通过临时预览验证 `beforeprint` 事件与打印 CSS 的回退网格；未验证系统打印分页。旧 0.4.3 字幕视频与新版 patch 的兼容试验也已通过。
- 系统 skill validator 不识别仓库已支持的 `disable-model-invocation` 字段；临时移除该字段后结构验证通过，仓库检查另外验证 Claude/Codex 均只允许显式调用。
- 接下来从已提交的干净工作区使用既有发布入口完成 spec 的 patch 发布要求。
