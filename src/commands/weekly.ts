import { Context } from 'koishi'
import type { Config, BillboardSource } from '../config'
import type { BillboardService } from '../service'
import { dispatchWeeklyOutput } from '../format'
import { sendReply } from '../utils/reply'

export function registerWeeklyCommand(ctx: Context, config: Config, service: BillboardService) {
  const logger = ctx.logger('billboard')

  ctx.command('周榜 [issue:number]', '🎵 查看 VOCALOID 术力口周榜')
    .alias('术力口周榜', 'bb')
    .usage([
      '快捷指令速查：',
      '  bb [期数]         查看最新或指定期数周榜 (默认按配置数据源)',
      '  bb -s bili [期数] 查看 B站本土 Bili Board 周榜',
      '  bb -s nico [期数] 查看 日本 N站 Billboard TOP20 周榜',
      '  周榜b [期数]      快捷直达 B站周榜',
      '  周榜n / nb [期数] 快捷直达 N站周榜',
      '  bb.history        查看最近收录的周榜期数一览',
      '  bb.search <歌名>  在近期周榜中搜索歌曲排位战绩',
      '  bb.reload         强制刷新远程数据缓存',
      '  bb.help           查看周榜帮助说明',
    ].join('\n'))
    .option('source', '-s, --source <source:string> 指定数据源 (bilibili/bili 或 niconico/nico)')
    .option('limit', '-n <limit:number> 展示排名前几位', { fallback: config.defaultTop })
    .option('cover', '-c, --cover <cover:string> 是否展示封面图 (y/n/yes/no/t/f/true/false)')
    .action(async ({ session, options }, targetIssue) => {
      const commandStartTime = Date.now()

      // 解析数据源: 优先命令行选项 -s，否则严格从 config.defaultSource 获取
      let source: BillboardSource = config.defaultSource
      if (options?.source) {
        const s = String(options.source).trim().toLowerCase()
        if (s === 'bili' || s === 'bilibili') {
          source = 'bilibili'
        } else if (s === 'nico' || s === 'niconico') {
          source = 'niconico'
        } else {
          await sendReply(session, config, `❌ 不支持的数据源「${options.source}」，仅支持 bilibili 或 niconico`)
          return
        }
      }

      if (!source) {
        throw new Error('未在配置中指定 defaultSource 且未提供 -s 参数')
      }

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
          detail = await service.getWeekly(source, targetIssue)
        } else {
          const res = await service.getLatest(source)
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

  // 快捷指令：周榜b
  ctx.command('周榜b [issue:number]', '📺 查看 Bili Board 术力口周榜 (B站本地榜单)')
    .action(async ({ session }, targetIssue) => {
      if (!session) return
      const arg = targetIssue ? ` ${targetIssue}` : ''
      return await session.execute(`bb -s bilibili${arg}`)
    })

  // 快捷指令：周榜n / nb
  ctx.command('周榜n [issue:number]', '🎵 查看 ニコニコ VOCALOID SONGS TOP20 (日本N站榜单)')
    .alias('nb')
    .action(async ({ session }, targetIssue) => {
      if (!session) return
      const arg = targetIssue ? ` ${targetIssue}` : ''
      return await session.execute(`bb -s niconico${arg}`)
    })

  ctx.command('周榜.帮助', '❓ 查看周榜相关指令与选项帮助 (bb.help)')
    .alias('周榜帮助', 'bb.help')
    .action(async ({ session }) => {
      if (!session) return
      return await session.execute('bb -h')
    })
}
