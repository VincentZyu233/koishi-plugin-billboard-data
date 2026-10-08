export type BillboardSource = 'bilibili' | 'niconico'

export interface BroadcastTarget {
  note?: string
  platform: string
  selfId?: string
  channelId: string
  sources: BillboardSource[]
  enabled: boolean
}

export type OutputFormat = 'text' | 'takumi' | 'puppeteer' | 'qq_markdown'
export type TakumiFontMode = 'release' | 'custom' | 'none'
export type PuppeteerFontMode = 'npm' | 'release' | 'custom' | 'none'
export type TextDetailedMode = 'standard' | 'simple'
export type TakumiDetailedMode = 'standard' | 'simple'
export type PuppeteerDetailedMode = 'standard' | 'simple'
export type QQMarkdownDetailedMode = 'card' | 'table'

export interface Config {
  // 消息交互设置
  enableQuote: boolean
  enableWaitingHint: boolean
  defaultSource: BillboardSource
  dataSources: string[]
  autoPurgeJsdelivr: boolean
  ghProxyPrefix: string
  customProxyUrl: string
  outputFormats: OutputFormat[]
  // 纯文本设置
  textDetailedMode: TextDetailedMode
  textShowRenderInfo: boolean
  // Takumi WASM 渲染设置
  takumiFontMode: TakumiFontMode
  takumiCustomFontPath: string
  takumiShowAllCovers: boolean
  takumiDetailedMode: TakumiDetailedMode
  takumiShowRenderInfo: boolean
  takumiScale: number
  // Puppeteer 网页出图设置
  puppeteerFontMode: PuppeteerFontMode
  puppeteerCustomFontPath: string
  puppeteerShowAllCovers: boolean
  puppeteerDetailedMode: PuppeteerDetailedMode
  puppeteerShowRenderInfo: boolean
  puppeteerScale: number
  // QQ 原生 Markdown 设置
  qqMarkdownDetailedMode: QQMarkdownDetailedMode
  qqMarkdownShowRenderInfo: boolean
  // 常规偏好与广播
  defaultTop: number
  showCover: boolean
  enableBroadcast: boolean
  broadcastTargets: BroadcastTarget[]
  checkInterval: number
}

import { Schema } from 'koishi'

export const Config: Schema<Config> = Schema.intersect([
  Schema.object({
    enableQuote: Schema.boolean()
      .default(true)
      .description('💬 是否引用触发指令的消息'),
    enableWaitingHint: Schema.boolean()
      .default(true)
      .description('⏳ 是否显示「正在获取并渲染周榜数据，请稍候...」等待提示（出图完成后将自动撤回）'),
    defaultSource: Schema.union([
      Schema.const('bilibili' as BillboardSource).description('📺 Bili Board 术力口周榜 (B站本地榜单)'),
      Schema.const('niconico' as BillboardSource).description('🎵 ニコニコ VOCALOID SONGS TOP20 (日本N站榜单)'),
    ])
      .role('radio')
      .default('bilibili')
      .description('🎯 默认周榜数据源（当指令未显式使用 -s 指定时生效）'),
  }).description('💬 消息交互设置'),

  Schema.object({
    dataSources: Schema.array(Schema.string())
      .role('table')
      .default([
        'https://cdn.jsdelivr.net/gh/VincentZyu233/billboard-data@main/data',
        'https://raw.githubusercontent.com/VincentZyu233/billboard-data/main/data',
        'https://cdn.jsdelivr.net/gh/VincentZyuApps/billboard-data@main/data',
        'https://raw.githubusercontent.com/VincentZyuApps/billboard-data/main/data',
      ])
      .description('📡 数据源列表（按顺序从前往后依次尝试请求）'),
    autoPurgeJsdelivr: Schema.boolean()
      .default(true)
      .experimental()
      .description('⚡ 请求 jsDelivr CDN 前主动调用 Purge 刷新 API（防止读取到旧版边缘缓存）'),
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
        Schema.const('qq_markdown' as OutputFormat).description('📊 QQ 原生 Markdown（含蓝字外链跳转，仅在 qq 平台生效）'),
      ])
    )
      .role('checkbox')
      .default(['text', 'takumi', 'puppeteer', 'qq_markdown'])
      .description('📤 周榜消息返回格式（支持多选，默认全部勾选；QQ Markdown 仅在 qq 平台生效）<br><i>默认全部勾选，可以按照自己的需要选择需要的，取消勾选不需要的格式捏~</i>'),
  }).description('📤 消息输出格式'),

  Schema.object({
    textDetailedMode: Schema.union([
      Schema.const('standard' as TextDetailedMode).description('📋 详细排版（展示原视频标题、上传者、时长、播放/弹幕/点赞数据等）'),
      Schema.const('simple' as TextDetailedMode).description('⚡ 极简排版（仅展示排名、歌曲名与 BV 号）'),
    ])
      .role('radio')
      .default('standard')
      .description('📋 纯文本信息详细度模式'),
    textShowRenderInfo: Schema.boolean()
      .default(true)
      .description('⏱️ 是否在文本末尾展示 API 请求耗时、尝试源数量与总耗时'),
  }).description('📝 纯文本排版设置'),

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
    takumiDetailedMode: Schema.union([
      Schema.const('standard' as TakumiDetailedMode).description('📋 完整看板（展示原视频标题、UP 主昵称/头像、时长及播放全量指标）'),
      Schema.const('simple' as TakumiDetailedMode).description('⚡ 极简看板（仅保留排位、封面与曲目名称）'),
    ])
      .role('radio')
      .default('standard')
      .description('📋 Takumi 出图信息详细度模式'),
    takumiShowRenderInfo: Schema.boolean()
      .default(true)
      .description('⏱️ 是否在出图水印处展示 API 请求耗时、尝试源数量与 WASM 渲染耗时'),
    takumiScale: Schema.number()
      .role('slider')
      .min(1)
      .max(3)
      .step(0.1)
      .default(1.5)
      .description('🔍 Takumi WASM 渲染缩放倍率 / 设备像素比 (devicePixelRatio)。默认 1.5 倍高清输出，数值越高越清晰细腻，但图片体积与渲染开销会略微增加。'),
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
    puppeteerDetailedMode: Schema.union([
      Schema.const('standard' as PuppeteerDetailedMode).description('📋 精美海报卡片（展示原视频标题、UP 主、播放六维指标条）'),
      Schema.const('simple' as PuppeteerDetailedMode).description('⚡ 精简海报（隐藏下方统计指标条）'),
    ])
      .role('radio')
      .default('standard')
      .description('📋 Puppeteer 出图信息详细度模式'),
    puppeteerShowRenderInfo: Schema.boolean()
      .default(true)
      .description('⏱️ 是否在网页底栏展示 API 请求耗时、尝试源数量与浏览器渲染耗时'),
    puppeteerScale: Schema.number()
      .role('slider')
      .min(1)
      .max(3)
      .step(0.1)
      .default(1.0)
      .description('🔍 Puppeteer 网页出图缩放倍率 / 设备像素比 (deviceScaleFactor)。默认保持 1.0 原生倍率不变。'),
  }).description('🎨 Puppeteer 网页出图设置'),

  Schema.object({
    qqMarkdownDetailedMode: Schema.union([
      Schema.const('card' as QQMarkdownDetailedMode).description('🎴 卡片流式排版（展示原视频标题、UP 主、播放六维指标与独立播放外链）'),
      Schema.const('table' as QQMarkdownDetailedMode).description('📊 紧凑表格排版（三列表格：排名、歌曲名、播放跳转）'),
    ])
      .role('radio')
      .default('card')
      .description('📋 QQ 原生 Markdown 排版呈现模式'),
    qqMarkdownShowRenderInfo: Schema.boolean()
      .default(true)
      .description('⏱️ 是否在 Markdown 末尾展示 API 请求耗时、尝试源数量与总耗时'),
  }).description('📊 QQ 原生 Markdown 设置'),

  Schema.object({
    defaultTop: Schema.number()
      .default(10)
      .min(1)
      .max(20)
      .description('🔢 默认展示前多少名（可通过 -n 参数临时覆盖，最大 20）'),
    showCover: Schema.boolean()
      .default(true)
      .description('🖼️ 查询周榜时是否附带第一名的榜单海报图片（仅纯文本模式生效）'),
  }).description('⚙️ 通用偏好设置'),

  Schema.object({
    enableBroadcast: Schema.boolean()
      .default(false)
      .description('🔔 是否启用每周新榜自动广播提醒'),
    broadcastTargets: Schema.array(Schema.object({
      note: Schema.string().default('').description('📝 备注'),
      platform: Schema.string().default('onebot').description('🎯 平台 (如 onebot, qq, discord)'),
      selfId: Schema.string().default('').description('🤖 Bot ID (可选，留空则匹配该平台任意 Bot)'),
      channelId: Schema.string().default('').description('📡 目标频道/群组 ID'),
      sources: Schema.array(Schema.union([
        Schema.const('bilibili' as BillboardSource).description('📺 Bili Board 术力口周榜'),
        Schema.const('niconico' as BillboardSource).description('🎵 ニコニコ VOCALOID SONGS TOP20'),
      ]))
        .role('checkbox')
        .default(['bilibili', 'niconico'])
        .description('📡 广播推送的数据源范围（支持多选，默认两者均推送）'),
      enabled: Schema.boolean().default(true).description('✅ 是否启用'),
    }))
      .role('table')
      .default([{
        note: 'awa测试群',
        platform: 'onebot',
        selfId: '',
        channelId: '958366323',
        sources: ['bilibili', 'niconico'],
        enabled: true,
      }])
      .description('🎯 广播推送目标表格（包含平台、Bot账号、群号、推送源范围及是否启用等；selfId 留空将向该平台所有满足条件的 Bot 发送）'),
    checkInterval: Schema.number()
      .default(15)
      .min(1)
      .max(120)
      .description('⏱️ 新榜自动检测周期（分钟）'),
  }).description('📢 订阅推送'),
])
