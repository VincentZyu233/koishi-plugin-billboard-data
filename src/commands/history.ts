import { Context } from 'koishi'
import type { Config, BillboardSource } from '../config'
import type { BillboardService } from '../service'
import { sendReply } from '../utils/reply'

export function registerHistoryCommand(ctx: Context, config: Config, service: BillboardService) {
  ctx.command('周榜.历史', '📜 查看最近收录的周榜期数列表 (bb.history)')
    .alias('周榜历史', 'bb.history')
    .option('source', '-s, --source <source:string> 指定数据源 (bilibili/bili 或 niconico/nico)')
    .action(async ({ session, options }) => {
      let source: BillboardSource = config.defaultSource
      if (options?.source) {
        const s = String(options.source).trim().toLowerCase()
        if (s === 'bili' || s === 'bilibili') source = 'bilibili'
        else if (s === 'nico' || s === 'niconico') source = 'niconico'
      }

      try {
        const index = await service.getIndex(source)
        const recent = index.issues.slice(0, 10)
        const sourceLabel = source === 'niconico' ? 'Niconico VOCALOID TOP20' : 'Bili Board 术力口周榜'

        const lines = [
          `📜【${sourceLabel} · 历史收录一览】`,
          `最新期数: 第 ${index.latest_issue} 期 (共收录 ${index.total_issues} 期)`,
          '━━━━━━━━━━━━━━━',
        ]

        for (const meta of recent) {
          lines.push(`• 第 ${meta.issue} 期 (${meta.date || '未知日期'}) - ${meta.total_ranked} 首曲目`)
        }

        lines.push('━━━━━━━━━━━━━━━')
        lines.push(`💡 输入「bb -s ${source} <期数>」即可快速查看指定期详细排名！`)

        await sendReply(session, config, lines.join('\n'))
      } catch (err: any) {
        await sendReply(session, config, `❌ 获取周榜历史失败: ${err.message || err}`)
      }
    })
}
