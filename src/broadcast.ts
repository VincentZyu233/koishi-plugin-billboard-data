import { Context } from 'koishi'
import type { Config, BillboardSource } from './config'
import type { BillboardService } from './service'
import { formatWeeklyText } from './format/text'

export function applyBroadcast(ctx: Context, config: Config, service: BillboardService) {
  if (!config.enableBroadcast || !config.broadcastTargets || config.broadcastTargets.length === 0) {
    return
  }

  const logger = ctx.logger('billboard')
  const lastKnownIssues: Record<BillboardSource, number> = {
    bilibili: 0,
    niconico: 0,
  }

  const sources: BillboardSource[] = ['bilibili', 'niconico']

  ctx.on('ready', async () => {
    for (const src of sources) {
      try {
        const initIndex = await service.getIndex(src)
        lastKnownIssues[src] = initIndex.latest_issue
        logger.info(`[${src}] 周榜自动推送已启动，当前基线期数: 第 ${lastKnownIssues[src]} 期`)
      } catch (e) {
        logger.warn(`[${src}] 初始化周榜期数失败: ${e}`)
      }
    }

    ctx.setInterval(async () => {
      for (const src of sources) {
        try {
          const index = await service.getIndex(src, true)
          if (index.latest_issue > lastKnownIssues[src]) {
            logger.info(`[${src}] 发现新发布周榜！第 ${index.latest_issue} 期，准备广播...`)
            const detail = await service.getWeekly(src, index.latest_issue)
            const msg = formatWeeklyText(detail, config.defaultTop, config.showCover)

            for (const target of config.broadcastTargets) {
              if (!target.enabled || !target.channelId) continue
              // 检查该目标订阅的源列表中是否包含当前数据源
              const targetSources = target.sources || ['bilibili', 'niconico']
              if (!targetSources.includes(src)) continue

              try {
                const matchedBots = ctx.bots.filter(b => {
                  if (b.platform !== target.platform) return false
                  if (target.selfId && target.selfId.trim() && b.selfId !== target.selfId.trim()) return false
                  return true
                })

                if (matchedBots.length > 0) {
                  for (const bot of matchedBots) {
                    try {
                      await bot.sendMessage(target.channelId, msg)
                      logger.info(`[广播推送 - ${src}] Bot(${bot.selfId}) 成功推送到 [${target.platform}:${target.channelId}]`)
                    } catch (sendErr) {
                      logger.warn(`[广播推送 - ${src}] Bot(${bot.selfId}) 发送到 [${target.platform}:${target.channelId}] 失败: ${sendErr}`)
                    }
                  }
                } else {
                  logger.warn(`[广播推送 - ${src}] 未找到匹配的在线 Bot: platform=${target.platform}, selfId=${target.selfId || '*'}`)
                }
              } catch (targetErr) {
                logger.warn(`[广播推送 - ${src}] 发送到 [${target.platform}:${target.channelId}] 失败: ${targetErr}`)
              }
            }
            lastKnownIssues[src] = index.latest_issue
          }
        } catch (err) {
          logger.warn(`检查 [${src}] 周榜更新异常: ${err}`)
        }
      }
    }, config.checkInterval * 60 * 1000)
  })
}
