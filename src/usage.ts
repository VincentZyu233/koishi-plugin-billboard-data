const pkg = require('../package.json')

const KOISHI_LOGO_BASE64 = 'data%3Aimage%2Fpng%3Bbase64%2CiVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAABU0lEQVR42p2UQSsFYRSGnxnqLuytKWKpKFkQNsS%2FsOHPWPADLCmxU5S7UzYWNrJR7lYiRF2FeWzOMKZ7mXHqNNP5vvP2nu%2B850CY2lP4X1K31ZbaDm%2BpO%2Bpyp5wfAXVEPfRvO1JHf4AVQGbUh7j4EZ4VkrNCXPVRnf3CUBN1SH2KC28VGOV3ntRhNclZHdcAKYM11QR1oVBOXctzFlNgBTC8qmXxPQEegbVeYApIgJT6tg%2F0AdMp0B%2FBpCabK2AAmAAa%2F2GRBft1oBFPkqTAba7LCiAfQC9wClwAY1HJHepuiO29Yrsf1Dn1uiDU3RTYCtTkl1Leg8k9MB4NGgReI28rV3azgyCz0og01Xl1Uz1QX8uCTELm3UbkTF1VJ9Wr0tn3iBSGdjYG0XivE3VN3VD31PM4a3cc2tIGGI0VkTO7rLxGuiy25ejmjfqsvkSXui62TxaK03td4FXTAAAAAElFTkSuQmCC'

const containerStyle = [
  'margin: 12px 0;',
  'padding: 16px 20px;',
  'border: 1px solid var(--k-color-border, rgba(127, 127, 127, 0.25));',
  'border-radius: 13px;',
  'background: var(--k-card-bg, rgba(127, 127, 127, 0.04));',
  'box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);',
  'color: var(--k-text-dark, inherit);',
  'line-height: 1.6;',
].join('')

const detailsStyle = [
  'margin: 12px 0;',
  'border: 1px solid var(--k-color-border, rgba(127, 127, 127, 0.3));',
  'border-radius: 10px;',
  'background: var(--k-card-bg, rgba(127, 127, 127, 0.03));',
  'overflow: hidden;',
  'box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);',
  'transition: border-color .2s ease, background-color .2s ease;',
].join('')

const summaryStyle = [
  'padding: 10px 14px;',
  'background: var(--k-hover-bg, rgba(127, 127, 127, 0.09));',
  'color: var(--k-text-dark, inherit);',
  'cursor: pointer;',
  'user-select: none;',
  'font-size: 14.5px;',
].join('')

const detailsBodyStyle = [
  'padding: 12px 16px 14px;',
  'border-top: 1px solid var(--k-color-divider, rgba(127, 127, 127, 0.2));',
  'background: var(--k-card-bg, transparent);',
  'color: var(--k-text-dark, inherit);',
  'line-height: 1.65;',
].join('')

export const usage = `
<div style="${containerStyle}">

  <h1 style="margin: 0 0 8px 0; color: #00AEEC; font-size: 22px; display: flex; align-items: center; gap: 8px;">
    <span>🎵</span> Koishi 插件：术力口周榜 billboard-data
  </h1>
  <div style="font-size: 13.5px; opacity: 0.85; margin-bottom: 12px;">
    🎯 <b>插件版本：</b><code>v${pkg.version}</code>
  </div>

  <p style="margin: 10px 0;">
    <a href="https://www.npmjs.com/package/koishi-plugin-billboard-data" target="_blank">
      <img src="https://img.shields.io/npm/v/koishi-plugin-billboard-data?style=flat-square&logo=npm" alt="npm version">
    </a>
    <a href="https://npm-stat.com/charts.html?package=koishi-plugin-billboard-data" target="_blank">
      <img src="https://img.shields.io/npm/dm/koishi-plugin-billboard-data?style=flat-square&logo=npm" alt="npm downloads">
    </a>
    <br>
    <a href="https://github.com/VincentZyuApps/koishi-plugin-billboard-data" target="_blank">
      <img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub">
    </a>
    <a href="https://gitee.com/vincent-zyu/koishi-plugin-billboard-data" target="_blank">
      <img src="https://img.shields.io/badge/Gitee-C71D23?style=for-the-badge&logo=gitee&logoColor=white" alt="Gitee">
    </a>
    <br>
    <a href="https://qm.qq.com/q/ZHj33L5cuC" target="_blank">
      <img src="https://img.shields.io/badge/QQ群-1085190201-12B7F5?style=flat-square&logo=qq&logoColor=white" alt="QQ群">
    </a>
  </p>

  <h2 style="margin: 18px 0 8px 0; font-size: 16px; border-bottom: 1px solid var(--k-color-divider, rgba(127, 127, 127, 0.2)); padding-bottom: 6px;">
    💬 交流反馈
  </h2>
  <p style="margin: 4px 0;">💬 插件使用问题 / 🐛 Bug反馈 / 👨‍💻 插件开发交流，欢迎加入QQ群：<b style="color: #12B7F5;">1085190201</b> 🎉</p>
  <p style="margin: 4px 0;">💡 在群里直接艾特我，回复的更快哦~ ✨</p>

  <blockquote style="margin: 14px 0; padding: 10px 14px; border-left: 5px solid #00AEEC; border-radius: 6px; background: rgba(0, 174, 236, 0.08); line-height: 1.6;">
    <b style="color: #00AEEC;">💡 双源数据体系与致谢：</b><br>
    • <b>Bilibili 本土周榜：</b>来源于 B 站 <a href="https://space.bilibili.com/3493269493907727/article" target="_blank" style="color: #00AEEC; font-weight: bold; text-decoration: underline;">@Bili-Board_Atel（点击直达B站专栏）</a>（Bilibili Vocaloid Songs 周榜 TOP20 专栏，示例：<code>Bili_Board术力口周榜第122期2026年10月7日第40周</code>）。<br>
    • <b>Niconico 日本周榜：</b>来源于 B 站 <a href="https://space.bilibili.com/5937105/article" target="_blank" style="color: #FB7299; font-weight: bold; text-decoration: underline;">@Elvansphere（点击直达B站专栏）</a>（Niconico Vocaloid Songs 周榜 TOP20 专栏，示例：<code>【2026/10/07】ニコニコ VOCALOID SONGS TOP20</code>，由 Billboard JAPAN 与 ニコニコ 官方合作出品）。<br>
    所有数据通过 GitHub 仓库 
    <a href="https://github.com/VincentZyuApps/billboard-data" target="_blank" style="color: #00AEEC; font-weight: bold;">VincentZyuApps/billboard-data</a> 定时自动化归档。
  </blockquote>

  <!-- 折叠区域 1 -->
  <details style="${detailsStyle}">
    <summary style="${summaryStyle}"><b style="color: #00AEEC;">🎨 渲染引擎与排版指南（Takumi / Puppeteer / QQ Markdown）</b></summary>
    <div style="${detailsBodyStyle}">
      <p style="margin: 4px 0;"><b>⚡ Takumi WASM 渲染出图：</b>基于 Rust/WASM 的轻量化渲染引擎，开箱即用，支持 <code>takumiScale</code> 放大倍率（默认 1.5 倍高清输出），适配移动端高分屏。</p>
      <p style="margin: 4px 0;"><b>🎨 Puppeteer 网页出图：</b>高保真海报级渲染，需要 Koishi 加载 <code>puppeteer</code> 服务。能完美呈现圆角、多重阴影与微缩歌曲封面。</p>
      <p style="margin: 4px 0;"><b>📊 QQ 原生 Markdown：</b>在 QQ 平台原生下发图文卡片与表格，支持蓝字外部跳转至 B 站原专栏或原视频。支持卡片流式排版与紧凑表格排版切换。</p>
      <p style="margin: 4px 0;"><b>📤 多选输出模式：</b>可在「消息输出格式」勾选列表中任意勾选需要的格式（纯文本、Takumi、Puppeteer、QQ Markdown），满足不同群聊场景需要。</p>
    </div>
  </details>

  <!-- 折叠区域 2 -->
  <details style="${detailsStyle}">
    <summary style="${summaryStyle}"><b style="color: #FB7299;">🕷️ 本地爬虫、7 层容灾矩阵与智能缓存</b></summary>
    <div style="${detailsBodyStyle}">
      <p style="margin: 4px 0;"><b>🕷️ 本地原生爬取：</b>内置轻量级纯 TypeScript 爬虫，可直接解析 <a href="https://space.bilibili.com/3493269493907727/article" target="_blank" style="color: #00AEEC; text-decoration: underline;">@Bili-Board_Atel</a> 与 <a href="https://space.bilibili.com/5937105/article" target="_blank" style="color: #FB7299; text-decoration: underline;">@Elvansphere</a> 的 B站动态专栏，无需等待 GitHub Action 定时归档即可秒查最新榜单！</p>
      <p style="margin: 4px 0;"><b>🛡️ 7 层容灾流水线：</b>预设 7 项多级通道（本地爬虫代理 -> 本地爬虫直连 -> jsDelivr代理 -> jsDelivr直连 -> GitHub反代 -> GitHub代理 -> GitHub直连）。当任一环节受阻时自上而下自动无缝降级。</p>
      <p style="margin: 4px 0;"><b>💾 Database / 内存智能缓存：</b>支持通过 Koishi <code>database</code> 服务或纯内存 Map 持久化周榜数据（默认缓存 10 小时）。</p>
      <p style="margin: 4px 0;"><b>🕒 周三 19:00 智能失效：</b>当跨越每周三 19:00（出榜时间节点）时，会自动令最新一期缓存失效，确保第一时间抓取当周新鲜榜单！</p>
      <p style="margin: 4px 0;"><b>❄️ 冷启动回溯与本地镜像：</b>开启 <code>enableBackfill</code> 时，首次启动可自动按稳定链路将 GitHub 历史全量数据同步入库；开启 <code>enableLocalBackup</code> 会在 <code>data/billboard-data/</code> 额外保存一份本地 JSON 作为运维查阅 bonus。</p>
    </div>
  </details>

  <!-- 折叠区域 3 -->
  <details style="${detailsStyle}">
    <summary style="${summaryStyle}"><b style="color: #ff8a00;">⏱️ 渲染耗时、尝试源统计与等待提示</b></summary>
    <div style="${detailsBodyStyle}">
      <p style="margin: 4px 0;"><b>⏳ 等待提示与自动撤回：</b>开启 <code>enableWaitingHint</code> 后，发起周榜指令时会立刻发送「正在获取并渲染周榜数据，请稍候...」，待最终文本或图片发送完成后，将自动撤回该提示消息。</p>
      <p style="margin: 4px 0;"><b>📊 统计指标展示：</b>提供 4 项独立的 <code>showRenderInfo</code> 开关。开启后会在输出结果后追加展示：
        <code>⏱️ API 请求: xx ms (尝试源: x) | 🎨/⚡ 渲染: xx ms | 📊 总耗时: xx ms</code>，精准反映拉取与渲染性能。</p>
    </div>
  </details>

  <!-- 折叠区域 4 -->
  <details style="${detailsStyle}">
    <summary style="${summaryStyle}"><b style="color: #2f855a;">📢 每周新榜自动广播推送 (Cron / 轮询)</b></summary>
    <div style="${detailsBodyStyle}">
      <p style="margin: 4px 0;"><b>🔔 自动检测与 Cron 调度：</b>支持为每个群组单独配置专属 <code>cron</code> 定时表达式（基于 Koishi <code>cron</code> 可选服务），同时也支持传统的 <code>checkInterval</code> 周期性轮询。</p>
      <p style="margin: 4px 0;"><b>🎯 目标广播表格：</b>在 <code>broadcastTargets</code> 中配置目标群号或频道 ID，并可为每个目标独立选择推送的数据源（B站 / N站）。<code>selfId</code> 留空时会自动向该平台所有已在线的机器人广播。</p>
    </div>
  </details>

  <h3 style="margin: 16px 0 6px 0; font-size: 15px;">📌 常用指令速查</h3>
  <pre style="margin: 4px 0; padding: 10px 14px; border-radius: 8px; background: var(--k-card-bg, rgba(0, 0, 0, 0.05)); border: 1px solid var(--k-color-divider, rgba(127, 127, 127, 0.2)); overflow-x: auto; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: 13px;"><code>bb [期数]         # 查看最新或指定期数周榜（默认数据源）
bb -s nico        # 查看日本 N站 VOCALOID TOP20 最新周榜
周榜b / bbb [期数] # 快捷查看 B站周榜
周榜n / nbb [期数] # 快捷查看 N站周榜
bb -n 20          # 展示 TOP 20
bb.history        # 查看近期收录的周榜期数总览（支持 -s 参数）
bb.search &lt;歌名&gt;  # 检索某首歌曲在近期周榜中的排位战绩（支持 -s 参数）
bb.reload         # 管理员强制刷新数据缓存
bb.help           # 查看周榜详细帮助与选项说明</code></pre>

</div>
`
