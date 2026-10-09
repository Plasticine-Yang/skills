# Answer Me 输出目录与技能精简

本方案的实现已合入 main，但发布前用户调整为仅保留纯文字。最终交付以 [Answer Me 仅保留纯文字](../answer-me-text-only/spec.md) 为准。

仅保留 `answer-me-with-text` 和 `answer-me-with-html-renderer`，删除独立 HTML、图解和视频技能。Renderer 继续提供图表与按需视频能力。

HTML、视频和配置缓存默认写入用户主目录下的 `~/.answer-me/` 分类目录。新产物采用 `<名称>-${hash}.<扩展名>`，hash 为每次生成时创建的 12 位随机十六进制串；同一视频的播放页和 MP4 共用后缀。局部修改保留已有文件名。

保留 `AM_HOME` 配置覆盖与显式输出路径能力。更新安装声明、说明和现有检查；完成中文提交后通过仓库入口发布 patch release。
