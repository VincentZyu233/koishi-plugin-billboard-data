import { Context, h } from 'koishi'
import type { Config } from './config'
import { Config as ConfigSchema } from './config'
import { BillboardService } from './service'

export const name = 'billboard-data'
export const inject = ['http']
export { ConfigSchema as Config }

export function apply(ctx: Context, config: Config) {
  const service = new BillboardService(ctx, config)
  const logger = ctx.logger('billboard')

  // 格式化单期周榜输出
  function formatWeeklyMessage(detail: any, limit: number, showCover: boolean) {
    const items = detail.items.slice(0, Math.min(limit, detail.items.length))
    const lines: (string | any)[] = []

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

    // 附带第 1 名的海报图片
    if (showCover && items.length > 0 && items[0].pic_url) {
      return [h.text(textPart), h.image(items[0].pic_url)]
    }

    return textPart
  }

  // 注册主指令
  ctx.command('周榜 [issue:number]', '🎵 查看 Bili Board 术力口周榜')
    .alias('术力口周榜', 'bb')
    .option('limit', '-n <limit:number> 展示排名前几位', { fallback: config.defaultTop })
    .option('cover', '-c 附带第一名封面图')
    .option('noCover', '-C 不展示封面图')
    .action(async ({ session, options }, targetIssue) => {
      const limit = Math.max(1, Math.min(20, options?.limit || config.defaultTop))
      const showCover = options?.noCover ? false : (options?.cover ? true : config.showCover)

      try {
        let detail
        if (targetIssue) {
          detail = await service.getWeekly(targetIssue)
        } else {
          const res = await service.getLatest()
          detail = res.detail
        }

        const reply = formatWeeklyMessage(detail, limit, showCover)
        if (config.enableQuote && session?.messageId) {
          if (Array.isArray(reply)) {
            await session.send([h.quote(session.messageId), ...reply])
          } else {
            await session.send(`${h.quote(session.messageId)}${reply}`)
          }
        } else {
          await session.send(reply)
        }
      } catch (err: any) {
        logger.error(err)
        await session?.send(`❌ 获取周榜数据失败: ${err.message || err}`)
      }
    })

  // 子指令：周榜历史
  ctx.command('周榜.历史', '📜 查看最近收录的周榜期数列表')
    .alias('周榜历史', 'bb.history')
    .action(async ({ session }) => {
      try {
        const index = await service.getIndex()
        const recent = index.issues.slice(0, 10)

        const lines = [
          '📜【术力口周榜 · 历史收录一览】',
          `最新期数: 第 ${index.latest_issue} 期 (共收录 ${index.total_issues} 期)`,
          '━━━━━━━━━━━━━━━',
        ]

        for (const meta of recent) {
          lines.push(`• 第 ${meta.issue} 期 (${meta.date || '未知日期'}) - ${meta.total_ranked} 首曲目`)
        }

        lines.push('━━━━━━━━━━━━━━━')
        lines.push('💡 输入「周榜 <期数>」即可快速查看指定期详细排名！')

        await session?.send(lines.join('\n'))
      } catch (err: any) {
        await session?.send(`❌ 获取周榜历史失败: ${err.message || err}`)
      }
    })

  // 子指令：查歌
  ctx.command('周榜.查歌 <keyword:string>', '🔍 在近期周榜中搜索歌曲排位')
    .alias('周榜搜歌', 'bb.search')
    .action(async ({ session }, keyword) => {
      if (!keyword || !keyword.trim()) {
        return '请输入要搜索的歌曲名称关键词，例如「周榜.查歌 敌人」'
      }

      try {
        await session?.send(`🔍 正在检索近 20 期周榜数据中...`)
        const result = await service.searchSong(keyword.trim())

        if (result.records.length === 0) {
          return `未在最近收录的周榜中检索到包含「${keyword}」的曲目。`
        }

        const lines = [
          `🔍【「${keyword}」周榜历史战绩】`,
          `共在 ${result.records.length} 期周榜中取得名次:`,
          '━━━━━━━━━━━━━━━',
        ]

        for (const rec of result.records.slice(0, 8)) {
          lines.push(`• 第 ${rec.issue} 期: 第 ${rec.rank} 名 - 《${rec.title}》`)
        }

        if (result.records.length > 8) {
          lines.push(`...等共 ${result.records.length} 次上榜`)
        }

        lines.push('━━━━━━━━━━━━━━━')
        lines.push('💡 发送「周榜 <期号>」可直达对应完整期数')

        await session?.send(lines.join('\n'))
      } catch (err: any) {
        await session?.send(`❌ 搜索失败: ${err.message || err}`)
      }
    })

  // 子指令：刷新缓存
  ctx.command('周榜.刷新', '🔄 强制刷新周榜远程数据缓存')
    .alias('bb.reload')
    .action(async ({ session }) => {
      try {
        const index = await service.getIndex(true)
        await session?.send(`✅ 周榜索引已强制刷新成功！当前最新: 第 ${index.latest_issue} 期。`)
      } catch (err: any) {
        await session?.send(`❌ 刷新失败: ${err.message || err}`)
      }
    })

  // 可选：定时检测并广播新周榜
  if (config.enableBroadcast && config.broadcastChannels.length > 0) {
    let lastKnownIssue = 0

    ctx.on('ready', async () => {
      try {
        const initIndex = await service.getIndex()
        lastKnownIssue = initIndex.latest_issue
        logger.info(`周榜自动推送已启动，当前基线期数: 第 ${lastKnownIssue} 期`)
      } catch (e) {
        logger.warn(`初始化周榜期数失败: ${e}`)
      }

      // 定时轮询
      ctx.setInterval(async () => {
        try {
          const index = await service.getIndex(true)
          if (index.latest_issue > lastKnownIssue) {
            logger.info(`发现新发布周榜！第 ${index.latest_issue} 期，准备广播...`)
            const detail = await service.getWeekly(index.latest_issue)
            const msg = formatWeeklyMessage(detail, config.defaultTop, config.showCover)

            for (const ch of config.broadcastChannels) {
              const [platform, channelId] = ch.split(':')
              if (platform && channelId) {
                const bot = ctx.bots.find(b => b.platform === platform)
                if (bot) {
                  await bot.sendMessage(channelId, msg)
                }
              }
            }
            lastKnownIssue = index.latest_issue
          }
        } catch (err) {
          logger.warn(`检查周榜更新异常: ${err}`)
        }
      }, config.checkInterval * 60 * 1000)
    })
  }
}
