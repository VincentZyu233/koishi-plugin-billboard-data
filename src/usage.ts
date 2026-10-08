const pkg = require('../package.json')

const KOISHI_LOGO_BASE64 = 'data%3Aimage%2Fpng%3Bbase64%2CiVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAABU0lEQVR42p2UQSsFYRSGnxnqLuytKWKpKFkQNsS%2FsOHPWPADLCmxU5S7UzYWNrJR7lYiRF2FeWzOMKZ7mXHqNNP5vvP2nu%2B850CY2lP4X1K31ZbaDm%2BpO%2Bpyp5wfAXVEPfRvO1JHf4AVQGbUh7j4EZ4VkrNCXPVRnf3CUBN1SH2KC28VGOV3ntRhNclZHdcAKYM11QR1oVBOXctzFlNgBTC8qmXxPQEegbVeYApIgJT6tg%2F0AdMp0B%2FBpCabK2AAmAAa%2F2GRBft1oBFPkqTAba7LCiAfQC9wClwAY1HJHepuiO29Yrsf1Dn1uiDU3RTYCtTkl1Leg8k9MB4NGgReI28rV3azgyCz0og01Xl1Uz1QX8uCTELm3UbkTF1VJ9Wr0tn3iBSGdjYG0XivE3VN3VD31PM4a3cc2tIGGI0VkTO7rLxGuiy25ejmjfqsvkSXui62TxaK03td4FXTAAAAAElFTkSuQmCC'

// 视觉样式：对齐 sky-renwu-weibo 与 60s 插件的高质感圆角卡片体系，结合 B 站经典蓝粉主题与明暗主题自适应
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
    <!-- <a href="https://forum.koishi.xyz/t/topic/xxxxx" target="_blank">
      <img src="https://img.shields.io/badge/Koishi%20Forum-xxxxx-5546A3?style=for-the-badge&logo=${KOISHI_LOGO_BASE64}&logoColor=white" alt="Koishi Forum">
    </a> -->
    <a href="https://qm.qq.com/q/ZHj33L5cuC" target="_blank">
      <img src="https://img.shields.io/badge/QQ群-1085190201-12B7F5?style=flat-square&logo=qq&logoColor=white" alt="QQ群">
    </a>
  </p>

  <h2 style="margin: 18px 0 8px 0; font-size: 16px; border-bottom: 1px solid var(--k-color-divider, rgba(127, 127, 127, 0.2)); padding-bottom: 6px;">
    💬 交流反馈
  </h2>
  <p style="margin: 4px 0;">🐛 Bug 反馈 / 💡 建议 / 👨‍💻 插件开发交流，欢迎加群：</p>
  <p style="margin: 4px 0;"><del>💬 插件使用问题 / 🐛 Bug反馈 / 👨‍💻 插件开发交流，欢迎加入QQ群：<b>259248174</b>   🎉（这个群G了）</del></p> 
  <p style="margin: 4px 0;">💬 插件使用问题 / 🐛 Bug反馈 / 👨‍💻 插件开发交流，欢迎加入QQ群：<b style="color: #12B7F5;">1085190201</b> 🎉</p>
  <p style="margin: 4px 0;">💡 在群里直接艾特我，回复的更快哦~ ✨</p>

  <blockquote style="margin: 14px 0; padding: 10px 14px; border-left: 5px solid #00AEEC; border-radius: 6px; background: rgba(0, 174, 236, 0.08); line-height: 1.6;">
    <b style="color: #00AEEC;">💡 双源数据体系与致谢：</b><br>
    • <b>Bilibili 周榜：</b>来源于 B 站 <b>@Bili Board Atel</b> 周榜公开专栏。<br>
    • <b>Niconico 周榜：</b>来源于日本 Billboard JAPAN 与 ニコニコ 官方合作出品、B 站 <b>@秋叶-风</b> 专栏同步归档的《ニコニコ VOCALOID SONGS TOP20》。<br>
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
      <blockquote style="margin: 10px 0 4px 0; padding: 8px 12px; border-left: 4px solid #00AEEC; border-radius: 4px; background: rgba(0, 174, 236, 0.06);">
        <b>💡 详细度切换：</b>纯文本、Takumi、Puppeteer 和 QQ Markdown 现均支持单选模式切换，可在完整详细看板与轻量精简排版之间自由选择。
      </blockquote>
    </div>
  </details>

  <!-- 折叠区域 2 -->
  <details style="${detailsStyle}">
    <summary style="${summaryStyle}"><b style="color: #FB7299;">📡 多源拉取、代理加速与 CDN 缓存说明</b></summary>
    <div style="${detailsBodyStyle}">
      <p style="margin: 4px 0;"><b>🌐 多源自动灾备：</b>默认内置 4 个数据源地址（按顺序尝试：jsDelivr CDN、GitHub Raw 以及主备镜像）。当首选节点受阻或延迟过高时，自动回退到备用镜像。</p>
      <p style="margin: 4px 0;"><b>⚡ autoPurgeJsdelivr（主动刷新 CDN）：</b>开启后，请求 jsDelivr 前会自动发起 purge 请求，避免拉取到过期缓存的旧榜单数据。</p>
      <p style="margin: 4px 0;"><b>🛡️ 网络代理配置：</b>支持 <code>ghProxyPrefix</code>（如 <code>https://gh-proxy.org/</code>）与自定义本地代理（如 <code>http://127.0.0.1:7890</code>），国内服务器亦可畅快稳定拉取。</p>
    </div>
  </details>

  <!-- 折叠区域 3 -->
  <details style="${detailsStyle}">
    <summary style="${summaryStyle}"><b style="color: #ff8a00;">⏱️ 渲染耗时、尝试源统计与等待提示</b></summary>
    <div style="${detailsBodyStyle}">
      <p style="margin: 4px 0;"><b>⏳ 等待提示与自动撤回：</b>开启 <code>enableWaitingHint</code> 后，发起周榜指令时会立刻发送「正在获取并渲染周榜数据，请稍候...」，待最终文本或图片发送完成后，将自动撤回该提示消息。</p>
      <p style="margin: 4px 0;"><b>📊 统计指标展示：</b>提供 4 项独立的 <code>showRenderInfo</code> 开关。开启后会在输出结果后追加展示：
        <code>⏱️ API 请求: xx ms (尝试源: x) | 🎨/⚡ 渲染: xx ms | 📊 总耗时: xx ms</code>，精准反映拉取与渲染性能。</p>
      <p style="margin: 4px 0;"><b>➖ 水平分割线：</b>纯文本、QQ Markdown 以及图片文本尾部均带有分割线隔离，视觉层次更清晰。</p>
    </div>
  </details>

  <!-- 折叠区域 4 -->
  <details style="${detailsStyle}">
    <summary style="${summaryStyle}"><b style="color: #2f855a;">📢 每周新榜自动广播推送</b></summary>
    <div style="${detailsBodyStyle}">
      <p style="margin: 4px 0;"><b>🔔 自动检测：</b>启用 <code>enableBroadcast</code> 后，插件将每隔 <code>checkInterval</code> 分钟检查是否有最新一期周榜发布，新榜出炉时自动广播。</p>
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
bb.reload         # 管理员强制刷新远程索引缓存
bb.help           # 查看周榜详细帮助与选项说明</code></pre>

</div>
`
