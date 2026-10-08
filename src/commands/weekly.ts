import { Context } from 'koishi'
import type { Config } from '../config'
import type { BillboardService } from '../service'
import { formatWeeklyMessage, sendReply } from '../utils'

export function registerWeeklyCommand(ctx: Context, config: Config, service: BillboardService) {
  const logger = ctx.logger('billboard')

  ctx.command('周榜 [issue:number]', '🎵 查看 Bili Board 术力口周榜')
    .alias('术力口周榜', 'bb')
    .usage([
      '快捷指令速查：',
      '  bb [期数]         查看最新或指定期数周榜',
      '  bb.history        查看最近收录的周榜期数一览',
      '  bb.search <歌名>  在近期周榜中搜索歌曲排位战绩',
      '  bb.reload         强制刷新远程数据缓存',
    ].join('\n'))
    .option('limit', '-n <limit:number> 展示排名前几位', { fallback: config.defaultTop })
    .option('cover', '-c, --cover <cover:string> 是否展示封面图 (y/n/yes/no/t/f/true/false)')
    .action(async ({ session, options }, targetIssue) => {
      const limit = Math.max(1, Math.min(20, options?.limit || config.defaultTop))
      let showCover = config.showCover
      if (options?.cover !== undefined && options?.cover !== null) {
        const val = String(options.cover).trim().toLowerCase()
        if (['y', 'yes', 't', 'true'].includes(val)) {
          showCover = true
        } else if (['n', 'no', 'f', 'false'].includes(val)) {
          showCover = false
        }
      }

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
        await sendReply(session, config, `❌ 获取周榜数据失败: ${err.message || err}`)
      }
    })
}
