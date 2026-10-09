# HTML renderer 上游更新调查

核查日期：2026-10-05（Asia/Shanghai）。本文为历史调研记录；HTML Renderer 与同步技能已从当前分发中移除，Answer Me 仅保留纯文字。原实现的版本与来源见 [v0.5.4 的 UPSTREAM.md](https://github.com/Plasticine-Yang/skills/blob/v0.5.4/skills/answer-me/answer-me-with-html-renderer/UPSTREAM.md)。下文记录当时的同步建议和验证边界，依据为上游 GitHub 发布页、固定提交源码及完整 Git 历史。

## 版本边界

| 对象 | 核实结果 | 一手来源 |
|---|---|---|
| 本次比较起点 | `9e8a88a62411f9fff21a33c5d4a79ca928e6a64e`，package `0.4.3` | [起点 package.json](https://github.com/QingYunA/answer-me-with-html/blob/9e8a88a62411f9fff21a33c5d4a79ca928e6a64e/package.json) |
| 最新正式发布 | `v0.4.9`，tag 指向 `bac7c464ee85f7008931de38e9fcaac95fa5a007` | [发布页](https://github.com/QingYunA/answer-me-with-html/releases/tag/v0.4.9)、[发布提交](https://github.com/QingYunA/answer-me-with-html/commit/bac7c464ee85f7008931de38e9fcaac95fa5a007) |
| 调查时 main | `700d9f95f0f1d7234d824e30d8d86242baa95533`，提交时间 `2026-10-05T22:50:14+08:00`；package 仍为 `0.4.9` | [main 固定提交](https://github.com/QingYunA/answer-me-with-html/commit/700d9f95f0f1d7234d824e30d8d86242baa95533)、[package.json](https://github.com/QingYunA/answer-me-with-html/blob/700d9f95f0f1d7234d824e30d8d86242baa95533/package.json) |

建议第一步固定正式发布 `v0.4.9`，同时记录完整 SHA；不能仅记录版本号，因为发布后的 main 仍报告同一版本。由 `git show v0.4.9:skills/answer-me-with-html/scripts/am.mjs` 计算的 SHA256 为 `22aba64b660f3036cbb4986d88ee3eb0a6a83cd923af4d8f52315e853380e2b1`；调查时 main bundle 为 `3fd6556fc15ef455e3c242ed3f91482426366ce338946ac76e39d62776d4793f`。这些是本次核查计算值。

## 0.4.3 → 正式发布 0.4.9 的主要变化

| 更新 | 对本地移植的意义 | 一手来源 |
|---|---|---|
| `patch` 正确读取末尾源稿，识别 HTML 根上的页面类型，保留视频、主题、明暗、STE 风格及配音选择；无声视频保持无声 | 值得优先跟进。旧页面的局部修改更可靠；配置改变后 patch 也不会意外重设风格 | [源稿与视频修复](https://github.com/QingYunA/answer-me-with-html/commit/9b1ee54)、[无声视频修复](https://github.com/QingYunA/answer-me-with-html/commit/116b29a)、[STE 风格修复](https://github.com/QingYunA/answer-me-with-html/commit/14ddb89)、[统一页面格式源码](https://github.com/QingYunA/answer-me-with-html/blob/bac7c464ee85f7008931de38e9fcaac95fa5a007/src/page.js) |
| sheet 在浏览器使用照片墙式排版：依内容宽度安排齐平的行，保持面板顺序；窄屏单列、打印及禁用 JavaScript 时回退网格 | 最大的可见变化。`span` 变成提示，不应再为宽表/宽图手工添加；`rows` 只影响回退网格。旧成品须重新 render 或 patch 才会获得新布局 | [0.4.9 发布说明](https://github.com/QingYunA/answer-me-with-html/releases/tag/v0.4.9)、[布局实现](https://github.com/QingYunA/answer-me-with-html/commit/8b7e7a9d9d345facdf5ae51977536ac6590b4ab2)、[发布版 SKILL.md](https://github.com/QingYunA/answer-me-with-html/blob/bac7c464ee85f7008931de38e9fcaac95fa5a007/skills/answer-me-with-html/SKILL.md) |
| 宽表/宽图改善、表头对齐修复、SVG 脱离主题上下文后仍可读 | 适合整体同步 CLI，再用现有页面验证桌面、窄屏与打印 | [宽内容修复](https://github.com/QingYunA/answer-me-with-html/commit/9642ad6)、[表头对齐](https://github.com/QingYunA/answer-me-with-html/commit/09a7f17)、[SVG 可读性](https://github.com/QingYunA/answer-me-with-html/commit/8a50e9b) |
| 修复视频对象过渡、长标题换行及字幕重叠；加入日文识别、字体、页面/视频 UI 和系统语音；图表及目录的可访问名称随稿件语言变化 | 视频及中英日页面质量改善；CLI 文本变成英文，生成页仍按读者语言本地化 | [视频修复](https://github.com/QingYunA/answer-me-with-html/commit/300b530)、[日文支持](https://github.com/QingYunA/answer-me-with-html/commit/dd1e2d1)、[英文 CLI/说明](https://github.com/QingYunA/answer-me-with-html/commit/0179fed)、[可访问名称](https://github.com/QingYunA/answer-me-with-html/commit/03fd531) |
| 新增显式 `--voice local`，调用兼容 `POST /v1/audio/speech` 的语音服务；ElevenLabs 新默认声音/模型及 `ELEVENLABS_MODEL_ID` | 可新增能力说明，但默认语音选择仍为 auto。local 需要服务端返回 16 位 PCM WAV，并配置 `AM_TTS_URL`；它不会凭空提供本地模型 | [local 实现](https://github.com/QingYunA/answer-me-with-html/commit/335c60c)、[发布版 TTS 源码](https://github.com/QingYunA/answer-me-with-html/blob/bac7c464ee85f7008931de38e9fcaac95fa5a007/src/video/tts.js)、[ElevenLabs 更新](https://github.com/QingYunA/answer-me-with-html/commit/1ca0988) |
| 清理时跳过根目录软链接；错误 callout `type: info` 写法得到提示；skill 描述缩短至规范限制内 | 一并同步 CLI 修复，按本地规则改写提示文本/skill 说明 | [清理修复](https://github.com/QingYunA/answer-me-with-html/commit/cb63887)、[callout 校验](https://github.com/QingYunA/answer-me-with-html/commit/a840641)、[描述长度](https://github.com/QingYunA/answer-me-with-html/commit/147446a) |

## main 中尚未进入正式发布的变化

完整 Git 历史显示 `v0.4.9` 后有三个提交，均未形成新版本号：

- [`4afe054`](https://github.com/QingYunA/answer-me-with-html/commit/4afe054)：缩短 README，将使用参考、视频及 ElevenLabs 说明拆到 `docs/`。
- [`6ab7221`](https://github.com/QingYunA/answer-me-with-html/commit/6ab7221)：中文写作检查加入错字、含糊数量、数字后的“以上/以下/以内”和统一用词规则，跳过日文。默认风格仅警告，严格风格仍可能阻止渲染。若希望本次引入，应单列为“发布后补丁”，并验证中文反例与 strict 稿件。
- [`700d9f9`](https://github.com/QingYunA/answer-me-with-html/commit/700d9f95f0f1d7234d824e30d8d86242baa95533)：每个主题集中成单一文件，由 registry 派生选择项、配置、页面标签及 CSS；主要是内部维护结构变化。

建议先跟进正式发布，把以上三项留作下一次同步选择；采用 main 时需明确记录 SHA 和未发布补丁。

## 打包、依赖与许可

- 分发入口仍是 `skills/answer-me-with-html/scripts/am.mjs`。构建将源码、CSS、页面运行时和依赖打成单文件；使用者只需 Node.js 20+，无需 `npm install`。照片墙布局运行时也已嵌入 bundle。不要手工合并生成文件；要么原样取固定版本，要么修改上游源码后重建。[构建脚本](https://github.com/QingYunA/answer-me-with-html/blob/bac7c464ee85f7008931de38e9fcaac95fa5a007/scripts/build.mjs)、[维护规范](https://github.com/QingYunA/answer-me-with-html/blob/700d9f95f0f1d7234d824e30d8d86242baa95533/CONTRIBUTING.md)
- 起点至 main 的 `package-lock.json` 仅改变根版本号，依赖未变：运行依赖仍为 `marked ^18.0.14`、`@dagrejs/dagre ^3.1.1`，开发依赖仍为 esbuild、yaml。本地消费 bundle 无须新增这些安装步骤。MP4 导出依然需要 Node.js 22+、Chrome/Chromium/Edge 和 ffmpeg。[起点 package.json](https://github.com/QingYunA/answer-me-with-html/blob/9e8a88a62411f9fff21a33c5d4a79ca928e6a64e/package.json)、[main package.json](https://github.com/QingYunA/answer-me-with-html/blob/700d9f95f0f1d7234d824e30d8d86242baa95533/package.json)、[导出实现](https://github.com/QingYunA/answer-me-with-html/blob/bac7c464ee85f7008931de38e9fcaac95fa5a007/src/video/export.js)
- 上游 LICENSE 未变，仍为 MIT，版权属于 Answer me with HTML contributors。分发时继续保留上游版权与许可文本，以及本地已有第三方许可材料。[固定版本 LICENSE](https://github.com/QingYunA/answer-me-with-html/blob/bac7c464ee85f7008931de38e9fcaac95fa5a007/LICENSE)

## 建议移植范围

1. 原样替换固定 `v0.4.9` 的 bundle，更新来源记录、版本、SHA256；保留本地包装入口，先验证新 bundle 与包装兼容。
2. 有选择地更新本地中文 SKILL.md：照片墙布局和 `span`/`rows` 语义、local TTS、新的英文 CLI 错误提示、日文稿件及 `lang: ja`、patch 保留设置。无需用上游英文 SKILL.md 覆盖本地说明。
3. 保留本地 skill 名称、显式调用约束、输出与配置目录、`AM_HOME` 覆盖、禁用上游更新检查及本仓库更新渠道。上游安装/更新命令适用于其原始 skill，不宜直接用于本地改名版本。[上游安装与更新说明](https://github.com/QingYunA/answer-me-with-html/blob/bac7c464ee85f7008931de38e9fcaac95fa5a007/skills/answer-me-with-html/SKILL.md)
4. 运行适用的独立安装和 CLI 检查；浏览器验证新布局、宽表、暗色、窄屏和打印，另验旧页面 patch、无声视频及用户覆盖路径。仅调查不意味着这些验证已经全部执行。

当时，本地仓库与已安装副本的包装入口、SKILL.md 和上游 bundle 已核对一致；两份旧 bundle 的 SHA256 都与来源记录相符。本地差异和更新流程可参考 [v0.5.4 的 UPSTREAM.md](https://github.com/Plasticine-Yang/skills/blob/v0.5.4/skills/answer-me/answer-me-with-html-renderer/UPSTREAM.md) 与 [当时的 THIRD_PARTY_NOTICES.md](https://github.com/Plasticine-Yang/skills/blob/v0.5.4/THIRD_PARTY_NOTICES.md)。当时升级需更新来源记录，添加 Changeset，运行仓库与独立安装检查后提交；中文页面/视频示例在起点与 v0.4.9 之间未变，安装副本沿原渠道和范围同步。这是已移除实现的维护记录。

## 临时兼容试验

本次调查期间，主 agent 将本地包装入口与固定 `v0.4.9` bundle 复制到临时目录，直接复用现有 `checkHtmlRenderer` 断言。配置、默认输出路径、禁用更新检查、patch、字幕视频、`AM_HOME` 覆盖均通过。另用旧 `0.4.3` 生成 `shadcn` / dark / `style: off` 字幕视频，再用新 bundle patch：页面仍为视频，并保留主题、明暗、写作风格及无配音状态。以上试验均在隔离的临时副本中执行，未替换仓库或已安装 skill。

该试验未执行真实全套 installer、全仓 `check` / `check-install`，也未做浏览器布局检查；结果只证明所测 CLI 和本地包装场景兼容。调查时 main bundle 也通过相同既有包装断言，但不改变优先采用正式发布的建议。
