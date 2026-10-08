import { Context } from 'koishi'
import type { Config, BillboardSource } from './config'
import type { IndexData, WeeklyDetail, IssueMeta } from './types'

export class BillboardService {
  private indexCaches = new Map<BillboardSource, { data: IndexData; time: number }>()
  private detailCaches = new Map<BillboardSource, Map<number, WeeklyDetail>>()

  private purgedUrls = new Set<string>()

  public lastApiDurationMs = 0
  public lastAttemptSourcesCount = 1

  constructor(private ctx: Context, private config: Config) {
    this.detailCaches.set('bilibili', new Map())
    this.detailCaches.set('niconico', new Map())
  }

  private isGitHubUrl(url: string): boolean {
    return /^https?:\/\/(raw\.githubusercontent\.com|github\.com|gist\.githubusercontent\.com)/i.test(url)
  }

  private isJsdelivrUrl(url: string): boolean {
    return /^https?:\/\/cdn\.jsdelivr\.net\//i.test(url)
  }

  private async purgeJsdelivr(url: string): Promise<void> {
    if (!this.config.autoPurgeJsdelivr) return
    if (!this.isJsdelivrUrl(url)) return
    if (this.purgedUrls.has(url)) return

    const purgeUrl = url.replace('https://cdn.jsdelivr.net/', 'https://purge.jsdelivr.net/')
    this.purgedUrls.add(url)
    try {
      await this.ctx.http.get(purgeUrl, { timeout: 5000 })
      this.ctx.logger('billboard').debug(`⚡ 成功触发 jsDelivr purge 刷新: ${purgeUrl}`)
    } catch (err: any) {
      this.ctx.logger('billboard').debug(`⚡ 触发 jsDelivr purge 跳过/忽略: ${err.message || err}`)
    }
  }

  private async fetchWithFallback<T>(path: string): Promise<T> {
    const startTime = Date.now()
    const sources = this.config.dataSources && this.config.dataSources.length > 0
      ? this.config.dataSources
      : [
          'https://cdn.jsdelivr.net/gh/VincentZyu233/billboard-data@main/data',
          'https://cdn.jsdelivr.net/gh/VincentZyuApps/billboard-data@main/data',
        ]

    const logger = this.ctx.logger('billboard')
    let lastErr: any = null
    let attempted = 0

    for (let sIdx = 0; sIdx < sources.length; sIdx++) {
      attempted = sIdx + 1
      const base = sources[sIdx].replace(/\/+$/, '')
      const rawUrl = `${base}/${path.replace(/^\/+/, '')}`

      await this.purgeJsdelivr(rawUrl)

      const attempts: { desc: string; url: string; options: { timeout: number; proxy?: string } }[] = []

      if (this.config.ghProxyPrefix?.trim() && this.isGitHubUrl(rawUrl)) {
        const prefix = this.config.ghProxyPrefix.trim().replace(/\/+$/, '')
        attempts.push({
          desc: 'gh-proxy 镜像加速',
          url: `${prefix}/${rawUrl}`,
          options: { timeout: 8000 },
        })
      }

      if (this.config.customProxyUrl?.trim()) {
        attempts.push({
          desc: '自定义本地代理',
          url: rawUrl,
          options: { timeout: 8000, proxy: this.config.customProxyUrl.trim() },
        })
      }

      attempts.push({
        desc: '直连访问',
        url: rawUrl,
        options: { timeout: 8000 },
      })

      for (const attempt of attempts) {
        try {
          const res = await this.ctx.http.get<T>(attempt.url, attempt.options)
          this.lastApiDurationMs = Date.now() - startTime
          this.lastAttemptSourcesCount = attempted
          return res
        } catch (err: any) {
          lastErr = err
          logger.warn(`数据源 [${sIdx + 1}/${sources.length}] 尝试 [${attempt.desc}] 失败 (${attempt.url}): ${err.message || err}`)
        }
      }
    }

    this.lastApiDurationMs = Date.now() - startTime
    this.lastAttemptSourcesCount = attempted
    throw new Error(`所有配置的数据源及代理策略均请求失败: ${lastErr?.message || lastErr}`)
  }

  clearCache() {
    this.indexCaches.clear()
    this.detailCaches.get('bilibili')?.clear()
    this.detailCaches.get('niconico')?.clear()
    this.purgedUrls.clear()
  }

  async getIndex(source: BillboardSource, force = false): Promise<IndexData> {
    const now = Date.now()
    const cached = this.indexCaches.get(source)
    if (!force && cached && now - cached.time < 600000) {
      return cached.data
    }

    const data = await this.fetchWithFallback<IndexData>(`${source}/index.json`)
    data.source = source
    this.indexCaches.set(source, { data, time: now })
    return data
  }

  async getWeekly(source: BillboardSource, issue: number, force = false): Promise<WeeklyDetail> {
    const sourceCache = this.detailCaches.get(source) || new Map<number, WeeklyDetail>()
    if (!force && sourceCache.has(issue)) {
      this.lastApiDurationMs = 0
      this.lastAttemptSourcesCount = 1
      return sourceCache.get(issue)!
    }

    const index = await this.getIndex(source, force)
    const issueMeta = index.issues.find(it => it.issue === issue)
    if (!issueMeta) {
      throw new Error(`未在 ${source} 数据源中找到第 ${issue} 期周榜数据`)
    }

    const relativePath = issueMeta.path.replace(/^\/+/, '')
    const fullPath = `${source}/${relativePath}`

    const data = await this.fetchWithFallback<WeeklyDetail>(fullPath)
    data.source = source
    sourceCache.set(issue, data)
    this.detailCaches.set(source, sourceCache)
    return data
  }

  async getLatest(source: BillboardSource): Promise<{ meta: IssueMeta; detail: WeeklyDetail }> {
    const index = await this.getIndex(source)
    if (!index.issues || index.issues.length === 0) {
      throw new Error(`未获取到 ${source} 的任何周榜数据`)
    }

    const latestMeta = index.issues[0]
    const detail = await this.getWeekly(source, latestMeta.issue)
    return { meta: latestMeta, detail }
  }

  async searchSong(source: BillboardSource, keyword: string, checkRecentCount = 20): Promise<{
    source: BillboardSource
    songTitle: string
    records: { issue: number; rank: number; title: string; author?: string; bvid: string; url: string }[]
  }> {
    const index = await this.getIndex(source)
    const targetIssues = index.issues.slice(0, checkRecentCount)
    const lowerKw = keyword.trim().toLowerCase()

    const records: { issue: number; rank: number; title: string; author?: string; bvid: string; url: string }[] = []

    for (const meta of targetIssues) {
      try {
        const detail = await this.getWeekly(source, meta.issue)
        for (const item of detail.items) {
          const titleMatches = item.title.toLowerCase().includes(lowerKw)
          const authorMatches = item.author && item.author.toLowerCase().includes(lowerKw)
          if (titleMatches || authorMatches) {
            records.push({
              issue: meta.issue,
              rank: item.rank,
              title: item.title,
              author: item.author,
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
      source,
      songTitle: keyword,
      records: records.sort((a, b) => b.issue - a.issue),
    }
  }
}
