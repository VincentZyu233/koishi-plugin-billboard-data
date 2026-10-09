import { Context } from 'koishi'
import type { Config, BillboardSource } from '../config'
import type { WeeklyDetail } from '../types'
import type { BillboardCacheRecord } from './schema'

export class CacheService {
  private memoryCache = new Map<string, { data: WeeklyDetail; updatedAt: number; isLatest: boolean }>()

  constructor(private ctx: Context, private config: Config) {}

  private get hasDatabase(): boolean {
    return this.config.cacheBackend === 'database' && !!(this.ctx as any).database
  }

  private isWednesdayExpired(updatedAtMs: number): boolean {
    if (!this.config.enableWeeklyInvalidation) return false

    const now = new Date()
    const updated = new Date(updatedAtMs)

    // 计算当周三 19:00:00 的时间戳
    const day = now.getDay() // 0 是周日, 3 是周三
    const wednesday = new Date(now)
    const diffDays = 3 - day
    wednesday.setDate(now.getDate() + diffDays)
    wednesday.setHours(19, 0, 0, 0)

    // 如果抓取时间在周三 19:00 之前，而当前时间已经到了周三 19:00 之后，立即过期！
    if (updated.getTime() < wednesday.getTime() && now.getTime() >= wednesday.getTime()) {
      return true
    }
    return false
  }

  isExpired(updatedAtMs: number, isLatest: boolean): boolean {
    if (this.config.cacheDuration <= 0) return true

    const now = Date.now()
    const maxAgeMs = this.config.cacheDuration * 60 * 1000
    if (now - updatedAtMs > maxAgeMs) {
      return true
    }

    if (isLatest && this.isWednesdayExpired(updatedAtMs)) {
      return true
    }

    return false
  }

  async get(source: BillboardSource, issue: number, isLatest = false): Promise<WeeklyDetail | null> {
    if (this.config.cacheDuration <= 0) return null

    if (this.hasDatabase) {
      try {
        const records = await this.ctx.database.get('billboard_cache', { source, issue })
        if (records && records.length > 0) {
          const record = records[0]
          const updateMs = new Date(record.updatedAt).getTime()
          if (!this.isExpired(updateMs, isLatest || record.isLatest)) {
            return record.data as WeeklyDetail
          }
        }
      } catch (err: any) {
        this.ctx.logger('billboard').warn(`读取数据库缓存失败，降级到内存: ${err.message || err}`)
      }
    }

    // 内存降级读取
    const memKey = `${source}:${issue}`
    const mem = this.memoryCache.get(memKey)
    if (mem && !this.isExpired(mem.updatedAt, isLatest || mem.isLatest)) {
      return mem.data
    }

    return null
  }

  async set(source: BillboardSource, issue: number, data: WeeklyDetail, isLatest = false): Promise<void> {
    if (this.config.cacheDuration <= 0) return

    const now = new Date()
    const memKey = `${source}:${issue}`
    this.memoryCache.set(memKey, { data, updatedAt: now.getTime(), isLatest })

    if (this.hasDatabase) {
      try {
        await this.ctx.database.upsert('billboard_cache', [{
          source,
          issue,
          isLatest,
          title: data.title || '',
          data,
          updatedAt: now,
        }], ['source', 'issue'])
      } catch (err: any) {
        this.ctx.logger('billboard').warn(`写入数据库缓存失败: ${err.message || err}`)
      }
    }
  }

  async clear(): Promise<void> {
    this.memoryCache.clear()
    if (this.hasDatabase) {
      try {
        await this.ctx.database.remove('billboard_cache', {})
      } catch (err: any) {
        this.ctx.logger('billboard').warn(`清空数据库缓存失败: ${err.message || err}`)
      }
    }
  }
}
