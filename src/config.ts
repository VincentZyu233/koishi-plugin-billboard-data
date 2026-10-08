import { Schema } from 'koishi'

export interface BroadcastTarget {
  note?: string
  platform: string
  selfId?: string
  channelId: string
  enabled: boolean
}

export type OutputFormat = 'text' | 'takumi' | 'puppeteer' | 'qq_markdown'
export type TakumiFontMode = 'release' | 'custom' | 'none'
export type PuppeteerFontMode = 'npm' | 'release' | 'custom' | 'none'

export interface Config {
  dataSources: string[]
  ghProxyPrefix: string
  customProxyUrl: string
  outputFormats: OutputFormat[]
  takumiFontMode: TakumiFontMode
  takumiCustomFontPath: string
  takumiShowAllCovers: boolean
  puppeteerFontMode: PuppeteerFontMode
  puppeteerCustomFontPath: string
  puppeteerShowAllCovers: boolean
  enableQuote: boolean
  defaultTop: number
  showCover: boolean
  enableBroadcast: boolean
  broadcastTargets: BroadcastTarget[]
  checkInterval: number
}

export const Config: Schema<Config> = Schema.intersect([
  Schema.object({
    dataSources: Schema.array(Schema.string())
      .role('table')
      .default([
        'https://cdn.jsdelivr.net/gh/VincentZyu233/billboard-data@main/data',
        'https://raw.githubusercontent.com/VincentZyu233/billboard-data/main/data',
      ])
      .description('📡 数据源列表（按顺序从前往后依次尝试请求）'),
  }).description('🌐 数据源设置'),

  Schema.object({
    ghProxyPrefix: Schema.string()
      .default('https://gh-proxy.org/')
      .description('🔗 公网 GitHub 代理前缀（留空表示不使用；若填写且当前数据源为 GitHub 地址，将优先通过该代理加速访问）'),
    customProxyUrl: Schema.string()
      .default('http://127.0.0.1:7890')
      .description('🌐 自定义代理服务器地址（支持 HTTP/HTTPS/SOCKS5；留空表示不使用；将在公网代理失败或非 GitHub 地址时尝试通过该代理访问）'),
  }).description('🛡️ 网络代理配置（请求时将依次自动尝试：gh-proxy 镜像加速 -> 自定义本地代理 -> 直连）'),

  Schema.object({
    outputFormats: Schema.array(
      Schema.union([
        Schema.const('text' as OutputFormat).description('📝 纯文本消息'),
        Schema.const('takumi' as OutputFormat).description('⚡ Takumi WASM 渲染出图（B站粉蓝极速轻量看板）'),
        Schema.const('puppeteer' as OutputFormat).description('🎨 Puppeteer 网页出图（高保真精美海报）'),
        Schema.const('qq_markdown' as OutputFormat).description('📊 QQ 原生 Markdown 表格（含蓝字外链跳转，仅在 qq 平台生效）'),
      ])
    )
      .role('checkbox')
      .default(['text', 'takumi', 'puppeteer', 'qq_markdown'])
      .description('📤 周榜消息返回格式（支持多选，默认全部勾选；QQ Markdown 仅在 qq 平台生效）'),
  }).description('📤 消息输出格式'),

  Schema.object({
    takumiFontMode: Schema.union([
      Schema.const('release' as TakumiFontMode).description('📥 Gitee / GitHub Release 下载（推荐，保存至 data/fonts）'),
      Schema.const('custom' as TakumiFontMode).description('📁 本地自定义字体路径'),
      Schema.const('none' as TakumiFontMode).description('🚫 不指定字体（使用系统环境内置字体）'),
    ])
      .role('radio')
      .default('release')
      .description('🔤 Takumi WASM 出图字体模式'),
    takumiCustomFontPath: Schema.string()
      .default('')
      .description('📁 Takumi 自定义字体文件路径（选为「本地自定义字体路径」时生效）'),
    takumiShowAllCovers: Schema.boolean()
      .default(true)
      .description('🖼️ 是否每首歌曲都展示封面图（开启时 TOP 2~N 列表项也附带微缩封面图）'),
  }).description('⚡ Takumi WASM 渲染设置'),

  Schema.object({
    puppeteerFontMode: Schema.union([
      Schema.const('npm' as PuppeteerFontMode).description('📦 npm 字体包（推荐，即装即用 lxgw-wenkai-webfont）'),
      Schema.const('release' as PuppeteerFontMode).description('📥 Gitee / GitHub Release 下载字体（复用 data/fonts）'),
      Schema.const('custom' as PuppeteerFontMode).description('📁 本地自定义字体路径'),
      Schema.const('none' as PuppeteerFontMode).description('🚫 不指定字体（使用浏览器默认字体）'),
    ])
      .role('radio')
      .default('npm')
      .description('🔤 Puppeteer 网页出图字体模式'),
    puppeteerCustomFontPath: Schema.string()
      .default('')
      .description('📁 Puppeteer 自定义字体文件路径（选为「本地自定义字体路径」时生效）'),
    puppeteerShowAllCovers: Schema.boolean()
      .default(true)
      .description('🖼️ 是否每首歌曲都展示封面图（开启时 TOP 2~N 列表项也附带高保真缩略图）'),
  }).description('🎨 Puppeteer 网页出图设置'),

  Schema.object({
    enableQuote: Schema.boolean()
      .default(true)
      .description('💬 是否启用引用回复'),
    defaultTop: Schema.number()
      .default(10)
      .min(1)
      .max(20)
      .description('🔢 默认展示前多少名（可通过 -n 参数临时覆盖，最大 20）'),
    showCover: Schema.boolean()
      .default(true)
      .description('🖼️ 查询周榜时是否附带第一名的榜单海报图片'),
  }).description('🎨 显示偏好'),

  Schema.object({
    enableBroadcast: Schema.boolean()
      .default(false)
      .description('🔔 是否启用每周新榜自动广播提醒'),
    broadcastTargets: Schema.array(Schema.object({
      note: Schema.string().default('').description('📝 备注'),
      platform: Schema.string().default('onebot').description('🎯 平台 (如 onebot, qq, discord)'),
      selfId: Schema.string().default('').description('🤖 Bot ID (可选，留空则匹配该平台任意 Bot)'),
      channelId: Schema.string().default('').description('📡 目标频道/群组 ID'),
      enabled: Schema.boolean().default(true).description('✅ 是否启用'),
    }))
      .role('table')
      .default([{
        note: 'awa测试群',
        platform: 'onebot',
        selfId: '',
        channelId: '958366323',
        enabled: true,
      }])
      .description('🎯 广播推送目标表格（包含平台、Bot账号、群号及是否启用等；selfId 留空将向该平台所有满足条件的 Bot 发送）'),
    checkInterval: Schema.number()
      .default(15)
      .min(1)
      .max(120)
      .description('⏱️ 新榜自动检测周期（分钟）'),
  }).description('📢 订阅推送'),
])
