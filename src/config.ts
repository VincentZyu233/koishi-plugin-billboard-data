import { Schema } from 'koishi'

export interface Config {
  dataSources: string[]
  proxyMode: 'none' | 'custom' | 'ghproxy'
  customProxyUrl: string
  ghProxyPrefix: string
  defaultTop: number
  showCover: boolean
  enableQuote: boolean
  enableBroadcast: boolean
  broadcastChannels: string[]
  checkInterval: number
}

export const Config: Schema<Config> = Schema.intersect([
  Schema.object({
    dataSources: Schema.array(Schema.string())
      .default([
        'https://cdn.jsdelivr.net/gh/VincentZyu233/billboard-data@main/data',
        'https://raw.githubusercontent.com/VincentZyu233/billboard-data/main/data',
      ])
      .description('数据源列表（按顺序从前往后依次尝试请求）'),
  }).description('数据源设置'),

  Schema.object({
    proxyMode: Schema.union([
      Schema.const('none').description('不走代理（直连访问）'),
      Schema.const('custom').description('走指定代理 URL（如本地科学代理）'),
      Schema.const('ghproxy').description('走公网 GitHub 加速代理（如 gh-proxy 镜像）'),
    ]).role('radio').default('ghproxy').description('网络代理模式'),
    customProxyUrl: Schema.string()
      .default('http://127.0.0.1:7890')
      .description('自定义代理服务器地址（支持 HTTP/HTTPS/SOCKS5，代理模式选为「走指定代理 URL」时生效）'),
    ghProxyPrefix: Schema.string()
      .default('https://gh-proxy.org/')
      .description('公网 GitHub 代理前缀（代理模式选为「公网 GitHub 加速代理」时生效）'),
  }).description('网络代理配置'),

  Schema.object({
    defaultTop: Schema.number()
      .default(10)
      .min(1)
      .max(20)
      .description('默认展示前多少名（可通过 -n 参数临时覆盖，最大 20）'),
    showCover: Schema.boolean()
      .default(true)
      .description('查询周榜时是否附带第一名的榜单海报图片'),
    enableQuote: Schema.boolean()
      .default(false)
      .description('是否启用引用回复'),
  }).description('显示偏好'),

  Schema.object({
    enableBroadcast: Schema.boolean()
      .default(false)
      .description('是否启用每周新榜自动广播提醒'),
    broadcastChannels: Schema.array(Schema.string())
      .default([])
      .description('接收新榜推送广播的目标频道 ID 列表 (格式: platform:channelId)'),
    checkInterval: Schema.number()
      .default(15)
      .min(1)
      .max(120)
      .description('新榜自动检测周期（分钟）'),
  }).description('订阅推送'),
])
