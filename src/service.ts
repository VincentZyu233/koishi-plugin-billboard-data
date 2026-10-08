import { Context } from 'koishi'
import type { Config } from './config'
import type { IndexData, WeeklyDetail, IssueMeta } from './types'

export class BillboardService {
  private indexCache: IndexData | null = null
  private indexCacheTime = 0
  private detailCache = new Map<number, WeeklyDetail>()

  constructor(private ctx: Context, private config: Config) {}

  private isGitHubUrl(url: string): boolean {
    return /^https?:\/\/(raw\.githubusercontent\.com|github\.com|gist\.githubusercontent\.com)/i.test(url)
  }

  private async fetchWithFallback<T>(path: string): Promise<T> {
    const sources = this.config.dataSources && this.config.dataSources.length > 0
      ? this.config.dataSources
      : ['https://cdn.jsdelivr.net/gh/VincentZyu233/billboard-data@main/data']

    const logger = this.ctx.logger('billboard')
    let lastErr: any = null

    for (let sIdx = 0; sIdx < sources.length; sIdx++) {
      const base = sources[sIdx].replace(/\/+$/, '')
      const rawUrl = `${base}/${path.replace(/^\/+/, '')}`

      // 构建针对当前 URL 的候选请求方案列表（依次尝试：gh-proxy -> 自定义代理 -> 直连）
      const attempts: { desc: string; url: string; options: { timeout: number; proxy?: string } }[] = []

      // 1. 公网 GitHub 加速代理（若填写且为 GitHub 域名）
      if (this.config.ghProxyPrefix?.trim() && this.isGitHubUrl(rawUrl)) {
        const prefix = this.config.ghProxyPrefix.trim().replace(/\/+$/, '')
        attempts.push({
          desc: 'gh-proxy 镜像加速',
          url: `${prefix}/${rawUrl}`,
          options: { timeout: 8000 },
        })
      }

      // 2. 自定义本地代理（若填写）
      if (this.config.customProxyUrl?.trim()) {
        attempts.push({
          desc: '自定义本地代理',
          url: rawUrl,
          options: { timeout: 8000, proxy: this.config.customProxyUrl.trim() },
        })
      }

      // 3. 直连访问（无代理）
      attempts.push({
        desc: '直连访问',
        url: rawUrl,
        options: { timeout: 8000 },
      })

      // 依次尝试该源的候选方案
      for (const attempt of attempts) {
        try {
          return await this.ctx.http.get<T>(attempt.url, attempt.options)
        } catch (err: any) {
          lastErr = err
          logger.warn(`数据源 [${sIdx + 1}/${sources.length}] 尝试 [${attempt.desc}] 失败 (${attempt.url}): ${err.message || err}`)
        }
      }
    }

    throw new Error(`所有配置的数据源及代理策略均请求失败: ${lastErr?.message || lastErr}`)
  }

  clearCache() {
    this.indexCache = null
    this.indexCacheTime = 0
    this.detailCache.clear()
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

  async getWeekly(issue: number, force = false): Promise<WeeklyDetail> {
    if (!force && this.detailCache.has(issue)) {
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
