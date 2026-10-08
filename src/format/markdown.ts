import type { Session, Context } from 'koishi'
import type { Config } from '../config'
import type { WeeklyDetail } from '../types'

export function buildWeeklyQQMarkdown(detail: WeeklyDetail, limit: number): string {
  const items = detail.items.slice(0, Math.min(limit, detail.items.length))
  let md = `# 🎵【Bili Board 术力口周榜】第 ${detail.issue} 期\n\n`
  
  const timeDesc = detail.date || detail.week ? `📅 ${detail.date || ''} (第 ${detail.week || ''} 周) | ` : ''
  md += `> ${timeDesc}[🌐 查看原专栏](${detail.source_url})\n\n`

  md += `| 排名 | 歌曲名称 | 视频链接 |\n`
  md += `| :---: | :--- | :---: |\n`

  for (const item of items) {
    let rankBadge = `【TOP ${item.rank}】`
    if (item.rank === 1) rankBadge = '🥇 TOP 1'
    else if (item.rank === 2) rankBadge = '🥈 TOP 2'
    else if (item.rank === 3) rankBadge = '🥉 TOP 3'

    const playLink = item.bvid ? `[▶ 播放](https://www.bilibili.com/video/${item.bvid})` : '-'
    // 转义表格中的管道符
    const safeTitle = item.title.replace(/\|/g, '&#124;')
    md += `| ${rankBadge} | ${safeTitle} | ${playLink} |\n`
  }

  md += `\n> 💡 发送「周榜 [期数]」查看历史，发送「周榜.查歌 <歌名>」检索战绩\n`
  return md
}

export async function sendWeeklyQQMarkdown(
  ctx: Context,
  session: Session,
  config: Config,
  detail: WeeklyDetail,
  limit: number
): Promise<boolean> {
  const logger = ctx.logger('billboard')
  if (session.platform !== 'qq') {
    return false
  }

  const content = buildWeeklyQQMarkdown(detail, limit)

  try {
    if (session.bot?.internal?.sendMessage) {
      await session.bot.internal.sendMessage(session.channelId, {
        msg_id: session.messageId,
        msg_type: 2,
        markdown: { content },
      })
      return true
    } else {
      // 适配其他可能的 QQ 适配器 markdown 节点下发
      await session.send({
        type: 'markdown',
        attrs: { content },
      } as any)
      return true
    }
  } catch (err: any) {
    logger.warn(`⚠️ QQ 原生 Markdown 发送失败: ${err.message || err}`)
    return false
  }
}
