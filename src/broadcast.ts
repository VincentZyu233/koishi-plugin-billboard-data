import { Context } from 'koishi'
import type { Config } from './config'
import type { BillboardService } from './service'
import { formatWeeklyMessage } from './utils'

export function applyBroadcast(ctx: Context, config: Config, service: BillboardService) {
  if (!config.enableBroadcast || !config.broadcastTargets || config.broadcastTargets.length === 0) {
    return
  }

  const logger = ctx.logger('billboard')
  let lastKnownIssue = 0

  ctx.on('ready', async () => {
    try {
      const initIndex = await service.getIndex()
      lastKnownIssue = initIndex.latest_issue
      logger.info(`周榜自动推送已启动，当前基线期数: 第 ${lastKnownIssue} 期`)
    } catch (e) {
      logger.warn(`初始化周榜期数失败: ${e}`)
    }

    ctx.setInterval(async () => {
      try {
        const index = await service.getIndex(true)
        if (index.latest_issue > lastKnownIssue) {
          logger.info(`发现新发布周榜！第 ${index.latest_issue} 期，准备广播...`)
          const detail = await service.getWeekly(index.latest_issue)
          const msg = formatWeeklyMessage(detail, config.defaultTop, config.showCover)

          for (const target of config.broadcastTargets) {
            if (!target.enabled || !target.channelId) continue

            try {
              const bot = ctx.bots.find(b => {
                if (b.platform !== target.platform) return false
                if (target.selfId && b.selfId !== target.selfId) return false
                return true
              })

              if (bot) {
                await bot.sendMessage(target.channelId, msg)
                logger.info(`[广播推送] 成功推送到 [${target.platform}:${target.channelId}]`)
              } else {
                logger.warn(`[广播推送] 未找到匹配的在线 Bot: platform=${target.platform}, selfId=${target.selfId || '*'}`)
              }
            } catch (targetErr) {
              logger.warn(`[广播推送] 发送到 [${target.platform}:${target.channelId}] 失败: ${targetErr}`)
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
