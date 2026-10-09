import { Context } from 'koishi'
import type { Config, BillboardSource } from '../config'
import type { WeeklyDetail, SongItem } from '../types'
import { BiliApiClient } from './client'

const BILI_UID = 3546800279522160 // @Bili-Board_Atel

export class BiliCrawler {
  private client: BiliApiClient

  constructor(private ctx: Context, private config: Config) {
    this.client = new BiliApiClient(ctx, config)
  }

  private parseOpusMeta(content: string, opusId: string): { issue: number; title: string; date: string; week?: number } | null {
    if (!content.includes('周榜')) return null
    const issueMatch = content.match(/第\s*(\d+)\s*期/)
    if (!issueMatch) return null

    const issue = parseInt(issueMatch[1], 10)
    let dateStr = ''
    const dateMatch = content.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/)
    if (dateMatch) {
      const y = parseInt(dateMatch[1], 10)
      const m = String(parseInt(dateMatch[2], 10)).padStart(2, '0')
      const d = String(parseInt(dateMatch[3], 10)).padStart(2, '0')
      dateStr = `${y}-${m}-${d}`
    }

    let week: number | undefined
    const weekMatch = content.match(/第\s*(\d+)\s*周/)
    if (weekMatch) {
      week = parseInt(weekMatch[1], 10)
    }

    return {
      issue,
      title: content.trim(),
      date: dateStr,
      week,
    }
  }

  async fetchLatest(proxy?: string): Promise<WeeklyDetail> {
    const spaceResp = await this.client.getSpaceDynamic(BILI_UID, '', proxy)
    if (spaceResp?.code !== 0 || !spaceResp.data?.items) {
      throw new Error(`B站动态接口返回异常: code=${spaceResp?.code}`)
    }

    for (const item of spaceResp.data.items) {
      const content = item.content || ''
      const opusId = String(item.opus_id || item.id || '')
      const meta = this.parseOpusMeta(content, opusId)
      if (meta) {
        return await this.crawlDetail(opusId, meta.issue, meta.title, meta.date, meta.week, proxy)
      }
    }

    throw new Error('未在 Bili-Board_Atel 最新动态中找到周榜专栏')
  }

  async fetchByIssue(targetIssue: number, proxy?: string): Promise<WeeklyDetail> {
    const page1 = await this.client.getSpaceDynamic(BILI_UID, '', proxy)
    if (page1?.code !== 0 || !page1.data?.items) {
      throw new Error(`B站动态接口返回异常: code=${page1?.code}`)
    }

    const items1 = page1.data.items
    const metas1: { issue: number; opusId: string; title: string; date: string; week?: number }[] = []

    for (const it of items1) {
      const c = it.content || ''
      const opId = String(it.opus_id || it.id || '')
      const m = this.parseOpusMeta(c, opId)
      if (m) metas1.push({ ...m, opusId: opId })
    }

    const hit1 = metas1.find(m => m.issue === targetIssue)
    if (hit1) {
      return await this.crawlDetail(hit1.opusId, hit1.issue, hit1.title, hit1.date, hit1.week, proxy)
    }

    if (metas1.length > 0) {
      const latestIssue = metas1[0].issue
      const diff = latestIssue - targetIssue
      if (diff > 0 && diff <= 40 && page1.data.has_more) {
        const offset = page1.data.offset || ''
        if (offset) {
          const page2 = await this.client.getSpaceDynamic(BILI_UID, offset, proxy)
          const items2 = page2?.data?.items || []
          for (const it of items2) {
            const c = it.content || ''
            const opId = String(it.opus_id || it.id || '')
            const m = this.parseOpusMeta(c, opId)
            if (m && m.issue === targetIssue) {
              return await this.crawlDetail(opId, m.issue, m.title, m.date, m.week, proxy)
            }
          }
        }
      }
    }

    throw new Error(`在 B站动态前两页中未直接找到第 ${targetIssue} 期周榜，交由后续数据源处理`)
  }

  private async crawlDetail(
    opusId: string,
    issue: number,
    columnTitle: string,
    dateStr: string,
    week?: number,
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
    const parsedEntries: { rank: number; title: string; bvid: string; url: string; pic_url: string }[] = []
    let currentEntry: any = null

    for (const p of paragraphs) {
      const textObj = p.text
      const picObj = p.pic

      if (textObj?.nodes) {
        const nodes = textObj.nodes
        const fullText = nodes.map((n: any) => n.word?.words || '').join('')
        const rankMatch = fullText.match(/第\s*(\d+)\s*名/)
        if (rankMatch) {
          const rank = parseInt(rankMatch[1], 10)
          let songTitle = ''
          let bvid = ''
          let jumpUrl = ''

          const richNode = nodes.find((n: any) => n.type === 'TEXT_NODE_TYPE_RICH' && n.rich)
          if (richNode) {
            songTitle = (richNode.rich.text || '').trim()
            jumpUrl = (richNode.rich.jump_url || '').trim()
            const bvMatch = jumpUrl.match(/BV[0-9a-zA-Z]+/)
            if (bvMatch) bvid = bvMatch[0]
          }

          if (!songTitle) {
            songTitle = fullText.replace(/第\s*\d+\s*名\s*[-–—:]*\s*/, '').trim()
          }

          currentEntry = {
            rank,
            title: songTitle,
            bvid,
            url: jumpUrl,
            pic_url: '',
          }
          parsedEntries.push(currentEntry)
        }
      } else if (picObj && currentEntry && !currentEntry.pic_url) {
        const pics = picObj.pics || []
        if (pics.length > 0) {
          currentEntry.pic_url = pics[0].url || ''
        }
      }
    }

    const items: SongItem[] = []
    for (const entry of parsedEntries) {
      let meta: any = null
      if (entry.bvid && entry.rank <= 20) {
        meta = await this.client.getVideoMeta({ bvid: entry.bvid }, proxy)
      }

      items.push({
        rank: entry.rank,
        title: entry.title,
        bvid: entry.bvid,
        url: entry.url || (entry.bvid ? `https://www.bilibili.com/video/${entry.bvid}` : ''),
        pic_url: entry.pic_url || meta?.pic || '',
        author: meta?.author,
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
      week,
      title: columnTitle,
      source: 'bilibili',
      source_url: `https://www.bilibili.com/opus/${opusId}`,
      pub_time_str: pubTimeStr,
      pub_ts: pubTs,
      updated_at: new Date().toISOString(),
      total_ranked: items.length,
      items,
    }
  }
}
