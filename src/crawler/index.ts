import { Context } from 'koishi'
import type { Config, BillboardSource } from '../config'
import type { WeeklyDetail } from '../types'
import { BiliCrawler } from './bili'
import { NicoCrawler } from './niconico'

export class CrawlerManager {
  private biliCrawler: BiliCrawler
  private nicoCrawler: NicoCrawler

  constructor(private ctx: Context, private config: Config) {
    this.biliCrawler = new BiliCrawler(ctx, config)
    this.nicoCrawler = new NicoCrawler(ctx, config)
  }

  async fetchLatest(source: BillboardSource, proxy?: string): Promise<WeeklyDetail> {
    if (source === 'bilibili') {
      return await this.biliCrawler.fetchLatest(proxy)
    } else {
      return await this.nicoCrawler.fetchLatest(proxy)
    }
  }

  async fetchByIssue(source: BillboardSource, issue: number, proxy?: string): Promise<WeeklyDetail> {
    if (source === 'bilibili') {
      return await this.biliCrawler.fetchByIssue(issue, proxy)
    } else {
      return await this.nicoCrawler.fetchByIssue(issue, proxy)
    }
  }
}
