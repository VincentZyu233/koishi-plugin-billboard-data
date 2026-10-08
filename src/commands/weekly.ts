import { Context } from 'koishi'
import type { Config } from '../config'
import type { BillboardService } from '../service'
import { dispatchWeeklyOutput } from '../format'
import { sendReply } from '../utils/reply'

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
      const commandStartTime = Date.now()
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

      let waitingHintMsgId: string | undefined
      if (config.enableWaitingHint && session) {
        try {
          const sent = await sendReply(session, config, '🎨 正在获取并渲染周榜数据，请稍候... ⏳')
          waitingHintMsgId = Array.isArray(sent) ? sent[0] : (typeof sent === 'string' ? sent : undefined)
        } catch {}
      }

      try {
        let detail
        if (targetIssue) {
          detail = await service.getWeekly(targetIssue)
        } else {
          const res = await service.getLatest()
          detail = res.detail
        }

        const stats = {
          apiDurationMs: service.lastApiDurationMs,
          attemptSourcesCount: service.lastAttemptSourcesCount,
          commandStartTime,
        }

        await dispatchWeeklyOutput(ctx, session, config, detail, limit, showCover, stats)
      } catch (err: any) {
        logger.error(err)
        await sendReply(session, config, `❌ 获取周榜数据失败: ${err.message || err}`)
      } finally {
        if (waitingHintMsgId && session?.bot?.deleteMessage && session?.channelId) {
          try {
            await session.bot.deleteMessage(session.channelId, waitingHintMsgId)
          } catch {}
        }
      }
    })
}
