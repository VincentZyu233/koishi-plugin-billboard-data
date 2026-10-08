import { Schema } from 'koishi'

export interface Config {
  dataSource: string
  fallbackSource: string
  defaultTop: number
  showCover: boolean
  enableQuote: boolean
  enableBroadcast: boolean
  broadcastChannels: string[]
  checkInterval: number
}

export const Config: Schema<Config> = Schema.object({
  dataSource: Schema.string()
    .default('https://cdn.jsdelivr.net/gh/VincentZyu233/billboard-data@main/data')
    .description('主数据源基础路径（推荐使用 jsDelivr CDN）'),
  fallbackSource: Schema.string()
    .default('https://raw.githubusercontent.com/VincentZyu233/billboard-data/main/data')
    .description('备用数据源基础路径（主源请求失败时尝试）'),
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
})
