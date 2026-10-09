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

  const sources: BillboardSource[] = config.broadcastSources && config.broadcastSources.length > 0
    ? config.broadcastSources
    : ['bilibili', 'niconico']

  const doBroadcast = async (src: BillboardSource, targetIssue?: number) => {
    try {
      const latest = await service.getLatest(src)
      const currentIssue = targetIssue || latest.detail.issue
      if (currentIssue <= lastKnownIssues[src]) return

      logger.info(`[${src}] 触发周榜广播！第 ${currentIssue} 期，准备向目标发送...`)
      const detail = latest.detail
      const msg = formatWeeklyText(detail, config.defaultTop, config.showCover)

      for (const target of config.broadcastTargets) {
        if (!target.enabled || !target.channelId) continue

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
      lastKnownIssues[src] = currentIssue
    } catch (err: any) {
      logger.warn(`检查并广播 [${src}] 周榜异常: ${err.message || err}`)
    }
  }

  ctx.on('ready', async () => {
    for (const src of sources) {
      try {
        const latest = await service.getLatest(src)
        lastKnownIssues[src] = latest.detail.issue
        logger.info(`[${src}] 周榜自动推送已启动，当前基线期数: 第 ${lastKnownIssues[src]} 期`)
      } catch (e) {
        logger.warn(`[${src}] 初始化周榜期数失败: ${e}`)
      }
    }

    // 1. Cron 专属目标调度（如果存在 cron 服务）
    if ((ctx as any).cron) {
      for (const target of config.broadcastTargets) {
        if (target.enabled && target.cron?.trim()) {
          (ctx as any).cron(target.cron.trim(), async () => {
            for (const src of sources) {
              await doBroadcast(src)
            }
          })
          logger.info(`[广播] 已成功为群组 [${target.channelId}] 挂载 Cron 定时: ${target.cron.trim()}`)
        }
      }
    }

    // 2. 传统周期性轮询调度（针对未配置 cron 的目标）
    ctx.setInterval(async () => {
      for (const src of sources) {
        await doBroadcast(src)
      }
    }, config.checkInterval * 60 * 1000)
  })
}
