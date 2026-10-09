import { Context } from 'koishi'
import type { Config } from '../config'
import type { WeeklyDetail, SongItem } from '../types'
import { BiliApiClient } from './client'

const NICO_UID = 12446725 // @Elvansphere

export class NicoCrawler {
  private client: BiliApiClient

  constructor(private ctx: Context, private config: Config) {
    this.client = new BiliApiClient(ctx, config)
  }

  private parseOpusMeta(content: string, opusId: string): { issue: number; title: string; date: string; week?: number } | null {
    if (!content.includes('VOCALOID SONGS TOP20')) return null
    const dateMatch = content.match(/【(\d{4})\/(\d{2})\/(\d{2})】/)
    if (!dateMatch) return null

    const y = parseInt(dateMatch[1], 10)
    const m = parseInt(dateMatch[2], 10)
    const d = parseInt(dateMatch[3], 10)
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`

    const baseMs = Date.UTC(2026, 9, 7)
    const curMs = Date.UTC(y, m - 1, d)
    const diffWeeks = Math.floor((curMs - baseMs) / (7 * 24 * 3600 * 1000))
    const issue = 188 + diffWeeks

    return {
      issue,
      title: content.trim(),
      date: dateStr,
    }
  }

  async fetchLatest(proxy?: string): Promise<WeeklyDetail> {
    const spaceResp = await this.client.getSpaceDynamic(NICO_UID, '', proxy)
    if (spaceResp?.code !== 0 || !spaceResp.data?.items) {
      throw new Error(`B站动态接口返回异常: code=${spaceResp?.code}`)
    }

    for (const item of spaceResp.data.items) {
      const content = item.content || ''
      const opusId = String(item.opus_id || item.id || '')
      const meta = this.parseOpusMeta(content, opusId)
      if (meta) {
        return await this.crawlDetail(opusId, meta.issue, meta.title, meta.date, proxy)
      }
    }

    throw new Error('未在 Elvansphere 最新动态中找到 Niconico 周榜专栏')
  }

  async fetchByIssue(targetIssue: number, proxy?: string): Promise<WeeklyDetail> {
    const page1 = await this.client.getSpaceDynamic(NICO_UID, '', proxy)
    if (page1?.code !== 0 || !page1.data?.items) {
      throw new Error(`B站动态接口返回异常: code=${page1?.code}`)
    }

    const items1 = page1.data.items
    const metas1: { issue: number; opusId: string; title: string; date: string }[] = []

    for (const it of items1) {
      const c = it.content || ''
      const opId = String(it.opus_id || it.id || '')
      const m = this.parseOpusMeta(c, opId)
      if (m) metas1.push({ ...m, opusId: opId })
    }

    const hit1 = metas1.find(m => m.issue === targetIssue)
    if (hit1) {
      return await this.crawlDetail(hit1.opusId, hit1.issue, hit1.title, hit1.date, proxy)
    }

    if (metas1.length > 0) {
      const latestIssue = metas1[0].issue
      const diff = latestIssue - targetIssue
      if (diff > 0 && diff <= 40 && page1.data.has_more) {
        const offset = page1.data.offset || ''
        if (offset) {
          const page2 = await this.client.getSpaceDynamic(NICO_UID, offset, proxy)
          const items2 = page2?.data?.items || []
          for (const it of items2) {
            const c = it.content || ''
            const opId = String(it.opus_id || it.id || '')
            const m = this.parseOpusMeta(c, opId)
            if (m && m.issue === targetIssue) {
              return await this.crawlDetail(opId, m.issue, m.title, m.date, proxy)
            }
          }
        }
      }
    }

    throw new Error(`在 B站动态前两页中未直接找到第 ${targetIssue} 期 Niconico 周榜，交由后续数据源处理`)
  }

  private async crawlDetail(
    opusId: string,
    issue: number,
    columnTitle: string,
    dateStr: string,
    proxy?: string
  ): Promise<WeeklyDetail> {
    const detailResp = await this.client.getOpusDetail(opusId, proxy)
    if (detailResp?.code !== 0 || !detailResp.data?.item) {
      throw new Error(`获取专栏详情失败: opus_id=${opusId}, code=${detailResp?.code}`)
    }

    const item = detailResp.data.item
    const modules = item.modules || []
    let contentModule: any = null
    let pubTimeStr = ''
    let pubTs: number | null = null

    for (const m of modules) {
      if (m.module_type === 'MODULE_TYPE_CONTENT') {
        contentModule = m
      } else if (m.module_type === 'MODULE_TYPE_AUTHOR') {
        const author = m.module_author || {}
        pubTimeStr = author.pub_time || ''
        pubTs = author.pub_ts || null
      }
    }

    if (!contentModule) {
      throw new Error(`专栏中缺少正文内容模块: opus_id=${opusId}`)
    }

    const paragraphs = contentModule.module_content?.paragraphs || []
    const parsedEntries: { rank: number; title: string; author: string; aid: string; prevRank?: string; weeks?: number }[] = []

    let currentRank: number | null = null
    let currentSong = ''
    let currentAuthor = ''
    let currentPrevRank = ''
    let currentWeeks: number | undefined

    for (const p of paragraphs) {
      const ptype = p.para_type
      if (ptype === 1) {
        const textNodes = p.text?.nodes || []
        const txt = textNodes.map((n: any) => n.word?.words || '').join('').trim()

        const rankMatch = txt.match(/^第\s*(\d+)\s*位\s*(.*)$/)
        if (rankMatch) {
          currentRank = parseInt(rankMatch[1], 10)
          const songAuthor = rankMatch.group ? rankMatch.group(2) : rankMatch[2]
          const parts = songAuthor.split('/')
          currentSong = parts[0]?.trim() || songAuthor
          currentAuthor = parts[1]?.trim() || ''
        }

        const statMatch = txt.match(/上周[：:]\s*([0-9—\-]+).*?在榜周数[：:]\s*(\d+)/)
        if (statMatch) {
          currentPrevRank = statMatch[1].trim()
          currentWeeks = parseInt(statMatch[2], 10)
        }
      } else if (ptype === 6 && currentRank !== null) {
        const card = p.link_card?.card || {}
        const oid = String(card.oid || '')
        parsedEntries.push({
          rank: currentRank,
          title: currentSong,
          author: currentAuthor,
          aid: oid,
          prevRank: currentPrevRank,
          weeks: currentWeeks,
        })
        currentRank = null
      }
    }

    const items: SongItem[] = []
    for (const entry of parsedEntries) {
      let meta: any = null
      if (entry.aid) {
        meta = await this.client.getVideoMeta({ aid: entry.aid }, proxy)
      }

      items.push({
        rank: entry.rank,
        title: entry.title,
        author: entry.author || meta?.author,
        prev_rank: entry.prevRank,
        weeks: entry.weeks,
        aid: entry.aid,
        bvid: '',
        url: entry.aid ? `https://www.bilibili.com/video/av${entry.aid}` : '',
        pic_url: meta?.pic || '',
        video_meta: meta ? {
          title: meta.title,
          duration: meta.duration,
          pubdate: 0,
          uploader: {
            mid: 0,
            name: meta.author,
            face: '',
          },
          stat: {
            view: meta.view,
            danmaku: meta.danmaku,
            reply: meta.reply,
            favorite: meta.favorite,
            coin: meta.coin,
            share: meta.share,
            like: meta.like,
          },
        } : null,
      })
    }

    items.sort((a, b) => a.rank - b.rank)

    return {
      issue,
      type: 'weekly',
      opus_id: opusId,
      date: dateStr,
      title: columnTitle,
      source: 'niconico',
      source_url: `https://www.bilibili.com/opus/${opusId}`,
      pub_time_str: pubTimeStr,
      pub_ts: pubTs,
      updated_at: new Date().toISOString(),
      total_ranked: items.length,
      items,
    }
  }
}
