import { h } from 'koishi'
import type { Config } from './config'
import type { WeeklyDetail } from './types'

export function formatWeeklyMessage(detail: WeeklyDetail, limit: number, showCover: boolean) {
  const items = detail.items.slice(0, Math.min(limit, detail.items.length))
  const lines: string[] = []

  lines.push(`🎵【Bili Board 术力口周榜】第 ${detail.issue} 期`)
  if (detail.date || detail.week) {
    lines.push(`📅 时间: ${detail.date || ''} (第 ${detail.week || ''} 周)`)
  }
  lines.push(`🔗 专栏: ${detail.source_url}`)
  lines.push('━━━━━━━━━━━━━━━')

  for (const item of items) {
    let medal = `${item.rank}.`
    if (item.rank === 1) medal = '🥇 TOP 1'
    else if (item.rank === 2) medal = '🥈 TOP 2'
    else if (item.rank === 3) medal = '🥉 TOP 3'

    lines.push(`${medal} ${item.title}`)
    if (item.bvid) {
      lines.push(`   ▶ https://bilibili.com/video/${item.bvid}`)
    }
  }

  lines.push('━━━━━━━━━━━━━━━')
  lines.push(`💡 发送「周榜 [期数]」查看历史，发送「周榜.查歌 <歌名>」检索战绩`)

  const textPart = lines.join('\n')

  if (showCover && items.length > 0 && items[0].pic_url) {
    return [h.text(textPart), h.image(items[0].pic_url)]
  }

  return textPart
}

export async function sendReply(session: any, config: Config, reply: any) {
  if (!session) return
  if (config.enableQuote && session.messageId) {
    if (Array.isArray(reply)) {
      return await session.send([h.quote(session.messageId), ...reply])
    } else {
      return await session.send([h.quote(session.messageId), typeof reply === 'string' ? h.text(reply) : reply])
    }
  } else {
    return await session.send(reply)
  }
}
