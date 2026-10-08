import type { Session, Context } from 'koishi'
import type { Config } from '../config'
import { type WeeklyDetail, type RenderStats, formatPublishTime, formatCount, formatDuration } from '../types'

export function buildWeeklyQQMarkdown(
  detail: WeeklyDetail,
  limit: number,
  detailedMode: 'card' | 'table' = 'card',
  stats?: RenderStats,
  showRenderInfo: boolean = false
): string {
  const items = detail.items.slice(0, Math.min(limit, detail.items.length))
  let md = `# 🎵【Bili Board 术力口周榜】第 ${detail.issue} 期\n\n`

  const timeStr = formatPublishTime(detail)
  const timeDesc = timeStr || detail.week ? `📅 ${timeStr} (第 ${detail.week || ''} 周) | ` : ''
  md += `> ${timeDesc}[🌐 查看原专栏](${detail.source_url})\n\n`

  if (detailedMode === 'card') {
    // 方案 B：流式卡片排版
    for (const item of items) {
      let rankBadge = `【TOP ${item.rank}】`
      if (item.rank === 1) rankBadge = '🥇 TOP 1'
      else if (item.rank === 2) rankBadge = '🥈 TOP 2'
      else if (item.rank === 3) rankBadge = '🥉 TOP 3'

      const playLink = item.bvid ? `[▶ 观看](${item.url || `https://www.bilibili.com/video/${item.bvid}`})` : ''
      md += `### ${rankBadge} ${item.title} ${playLink}\n`

      if (item.video_meta) {
        const meta = item.video_meta
        const uploaderName = meta.uploader?.name || '未知'
        const dur = formatDuration(meta.duration)
        const s = meta.stat || ({} as any)
        if (meta.title) {
          md += `> 🎬 原视频标题: ${meta.title}\n`
        }
        md += `> 👤 视频上传者: **${uploaderName}** ｜ ⏱️ 时长: ${dur}\n`
        md += `> 📊 播放: ${formatCount(s.view)} · 弹幕: ${formatCount(s.danmaku)} · 点赞: ${formatCount(s.like)} · 投币: ${formatCount(s.coin)} · 收藏: ${formatCount(s.favorite)}\n\n`
      } else {
        if (item.bvid) {
          md += `> 🔗 BV: ${item.bvid}\n\n`
        }
      }
    }
  } else {
    // 紧凑表格排版
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
  }

  md += `\n> 💡 发送「周榜 [期数]」查看历史，发送「周榜.查歌 <歌名>」检索战绩\n`
  if (showRenderInfo && stats) {
    const totalMs = Date.now() - stats.commandStartTime
    md += `\n---\n> ⏱️ API 请求: ${stats.apiDurationMs}ms (尝试源: ${stats.attemptSourcesCount}) | 📊 总耗时: ${totalMs}ms\n`
  }
  return md
}

export async function sendWeeklyQQMarkdown(
  ctx: Context,
  session: Session,
  config: Config,
  detail: WeeklyDetail,
  limit: number,
  stats?: RenderStats
): Promise<boolean> {
  const logger = ctx.logger('billboard')
  if (session.platform !== 'qq') {
    return false
  }

  const detailedMode = config.qqMarkdownDetailedMode ?? 'card'
  const showRenderInfo = config.qqMarkdownShowRenderInfo ?? true
  const content = buildWeeklyQQMarkdown(detail, limit, detailedMode, stats, showRenderInfo)

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
