import { Context } from 'koishi'
import type { Config } from '../config'

export interface BiliVideoMeta {
  title: string
  pic: string
  duration: number
  author: string
  view: number
  danmaku: number
  reply: number
  favorite: number
  coin: number
  share: number
  like: number
}

export class BiliApiClient {
  private userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

  constructor(private ctx: Context, private config: Config) {}

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'User-Agent': this.userAgent,
      'Referer': 'https://www.bilibili.com/',
    }
    if (this.config.enableBilibiliCookie && this.config.bilibiliCookie?.trim()) {
      headers['Cookie'] = this.config.bilibiliCookie.trim()
    }
    return headers
  }

  async getSpaceDynamic(hostMid: number, offset = '', proxy?: string): Promise<any> {
    let url = `https://api.bilibili.com/x/polymer/web-dynamic/v1/opus/feed/space?host_mid=${hostMid}`
    if (offset) {
      url += `&offset=${offset}`
    }

    const options: any = {
      headers: this.getHeaders(),
      timeout: 10000,
    }
    if (proxy) options.proxy = proxy

    return await this.ctx.http.get(url, options)
  }

  async getOpusDetail(opusId: string, proxy?: string): Promise<any> {
    const url = `https://api.bilibili.com/x/polymer/web-dynamic/v1/opus/detail?id=${opusId}`
    const options: any = {
      headers: this.getHeaders(),
      timeout: 10000,
    }
    if (proxy) options.proxy = proxy

    return await this.ctx.http.get(url, options)
  }

  async getVideoMeta(bvidOrAid: { bvid?: string; aid?: string }, proxy?: string): Promise<BiliVideoMeta | null> {
    let url = 'https://api.bilibili.com/x/web-interface/view?'
    if (bvidOrAid.bvid) {
      url += `bvid=${bvidOrAid.bvid}`
    } else if (bvidOrAid.aid) {
      url += `aid=${bvidOrAid.aid}`
    } else {
      return null
    }

    const options: any = {
      headers: this.getHeaders(),
      timeout: 8000,
    }
    if (proxy) options.proxy = proxy

    try {
      const resp = await this.ctx.http.get(url, options)
      if (resp?.code === 0 && resp.data) {
        const d = resp.data
        const owner = d.owner || {}
        const stat = d.stat || {}
        return {
          title: d.title || '',
          pic: d.pic || '',
          duration: d.duration || 0,
          author: owner.name || '',
          view: stat.view || 0,
          danmaku: stat.danmaku || 0,
          reply: stat.reply || 0,
          favorite: stat.favorite || 0,
          coin: stat.coin || 0,
          share: stat.share || 0,
          like: stat.like || 0,
        }
      }
    } catch (e) {
      // 视频元数据获取失败不阻塞主流程
    }
    return null
  }
}
