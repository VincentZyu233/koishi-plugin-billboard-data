import { Context } from 'koishi'
import type { Config } from '../config'
import type { BillboardService } from '../service'
import { formatWeeklyMessage, sendReply } from '../utils'

export function registerWeeklyCommand(ctx: Context, config: Config, service: BillboardService) {
  const logger = ctx.logger('billboard')

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
        await sendReply(session, config, reply)
      } catch (err: any) {
        logger.error(err)
        await session?.send(`❌ 获取周榜数据失败: ${err.message || err}`)
      }
    })
}
