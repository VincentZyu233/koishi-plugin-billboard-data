import { Schema } from 'koishi'

export interface BroadcastTarget {
  note?: string
  platform: string
  selfId?: string
  channelId: string
  enabled: boolean
}

export interface Config {
  dataSources: string[]
  proxyMode: 'none' | 'custom' | 'ghproxy'
  customProxyUrl: string
  ghProxyPrefix: string
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
    proxyMode: Schema.union([
      Schema.const('none').description('⚡ 不走代理（直连访问）'),
      Schema.const('custom').description('🔀 走指定代理 URL（如本地代理）'),
      Schema.const('ghproxy').description('🚀 走公网 GitHub 加速代理（如 gh-proxy 镜像）'),
    ]).role('radio').default('ghproxy').description('🚀 网络代理模式'),
    customProxyUrl: Schema.string()
      .default('http://127.0.0.1:7890')
      .description('🌐 自定义代理服务器地址（支持 HTTP/HTTPS/SOCKS5，代理模式选为「走指定代理 URL」时生效）'),
    ghProxyPrefix: Schema.string()
      .default('https://gh-proxy.org/')
      .description('🔗 公网 GitHub 代理前缀（代理模式选为「公网 GitHub 加速代理」时生效）'),
  }).description('🛡️ 网络代理配置'),

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
