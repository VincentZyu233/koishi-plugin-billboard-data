import { Context } from 'koishi'
import type { Config } from './config'
import type { IndexData, WeeklyDetail, IssueMeta } from './types'

export class BillboardService {
  private indexCache: IndexData | null = null
  private indexCacheTime = 0
  private detailCache = new Map<number, WeeklyDetail>()

  constructor(private ctx: Context, private config: Config) {}

  private async fetchWithFallback<T>(path: string): Promise<T> {
    const primaryUrl = `${this.config.dataSource.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
    try {
      return await this.ctx.http.get<T>(primaryUrl, { timeout: 8000 })
    } catch (primaryErr) {
      this.ctx.logger('billboard').warn(`主源请求失败 (${primaryUrl}): ${primaryErr}，尝试备用源...`)
      const fallbackUrl = `${this.config.fallbackSource.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
      return await this.ctx.http.get<T>(fallbackUrl, { timeout: 10000 })
    }
  }

  async getIndex(force = false): Promise<IndexData> {
    const now = Date.now()
    // 缓存 10 分钟 (600,000 ms)
    if (!force && this.indexCache && now - this.indexCacheTime < 600000) {
      return this.indexCache
    }

    const data = await this.fetchWithFallback<IndexData>('index.json')
    this.indexCache = data
    this.indexCacheTime = now
    return data
  }

  async getWeekly(issue: number): Promise<WeeklyDetail> {
    if (this.detailCache.has(issue)) {
      return this.detailCache.get(issue)!
    }

    const data = await this.fetchWithFallback<WeeklyDetail>(`weekly/${issue}.json`)
    this.detailCache.set(issue, data)
    return data
  }

  async getLatest(): Promise<{ meta: IssueMeta; detail: WeeklyDetail }> {
    const index = await this.getIndex()
    if (!index.issues || index.issues.length === 0) {
      throw new Error('未获取到任何周榜数据')
    }

    const latestMeta = index.issues[0]
    const detail = await this.getWeekly(latestMeta.issue)
    return { meta: latestMeta, detail }
  }

  async searchSong(keyword: string, checkRecentCount = 20): Promise<{
    songTitle: string
    records: { issue: number; rank: number; title: string; bvid: string; url: string }[]
  }> {
    const index = await this.getIndex()
    const targetIssues = index.issues.slice(0, checkRecentCount)
    const lowerKw = keyword.trim().toLowerCase()

    const records: { issue: number; rank: number; title: string; bvid: string; url: string }[] = []

    for (const meta of targetIssues) {
      try {
        const detail = await this.getWeekly(meta.issue)
        for (const item of detail.items) {
          if (item.title.toLowerCase().includes(lowerKw)) {
            records.push({
              issue: meta.issue,
              rank: item.rank,
              title: item.title,
              bvid: item.bvid,
              url: item.url,
            })
          }
        }
      } catch (err) {
        // 忽略单个失败期数
      }
    }

    return {
      songTitle: keyword,
      records: records.sort((a, b) => b.issue - a.issue),
    }
  }
}
